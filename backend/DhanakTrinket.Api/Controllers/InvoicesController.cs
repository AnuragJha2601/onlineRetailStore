using DhanakTrinket.Core.DTOs;
using DhanakTrinket.Core.Entities;
using DhanakTrinket.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class InvoicesController : ControllerBase
{
    private readonly DhanakTrinketDbContext _db;
    private readonly IWebHostEnvironment _env;

    // Customer-safe columns are the default export; internal ones must be opted in.
    private static readonly HashSet<string> ValidColumns =
        new(StringComparer.OrdinalIgnoreCase) { "item", "qty", "price", "total", "cost", "margin", "profit" };
    private static readonly string[] DefaultColumns = { "item", "qty", "price", "total" };

    public InvoicesController(DhanakTrinketDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // POST /api/invoices — create a new bill
    [HttpPost]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> CreateInvoice([FromBody] SaveInvoiceRequest request)
    {
        var validationError = Validate(request);
        if (validationError != null)
            return BadRequest(ApiResponse<InvoiceDto>.ErrorResponse(validationError));

        var invoiceDate = request.InvoiceDate == default ? DateTime.UtcNow : request.InvoiceDate;
        var year = invoiceDate.Year;

        // Next sequence for the year — count deleted bills too so numbers are never reused.
        var lastSeq = await _db.Invoices
            .IgnoreQueryFilters()
            .Where(i => i.Year == year)
            .MaxAsync(i => (int?)i.SequenceNumber) ?? 0;
        var seq = lastSeq + 1;

        var invoice = new Invoice
        {
            InvoiceNumber = $"DT-{year}-{seq:D4}",
            Year = year,
            SequenceNumber = seq,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = string.IsNullOrWhiteSpace(request.CustomerPhone) ? null : request.CustomerPhone.Trim(),
            InvoiceDate = invoiceDate,
            Shipping = request.Shipping,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Items = request.Items.Select(BuildItem).ToList()
        };

        ApplyTotals(invoice);

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<InvoiceDto>.SuccessResponse(MapToDto(invoice), $"Bill {invoice.InvoiceNumber} created."));
    }

    // PUT /api/invoices/{id} — edit an existing bill (keeps its number)
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> UpdateInvoice(int id, [FromBody] SaveInvoiceRequest request)
    {
        var validationError = Validate(request);
        if (validationError != null)
            return BadRequest(ApiResponse<InvoiceDto>.ErrorResponse(validationError));

        var invoice = await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null)
            return NotFound(ApiResponse<InvoiceDto>.ErrorResponse("Bill not found."));

        invoice.CustomerName = request.CustomerName.Trim();
        invoice.CustomerPhone = string.IsNullOrWhiteSpace(request.CustomerPhone) ? null : request.CustomerPhone.Trim();
        invoice.InvoiceDate = request.InvoiceDate == default ? invoice.InvoiceDate : request.InvoiceDate;
        invoice.Shipping = request.Shipping;
        invoice.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        invoice.UpdatedAt = DateTime.UtcNow;

        // Replace all line items
        _db.InvoiceItems.RemoveRange(invoice.Items);
        invoice.Items = request.Items.Select(BuildItem).ToList();

        ApplyTotals(invoice);

        await _db.SaveChangesAsync();

        return Ok(ApiResponse<InvoiceDto>.SuccessResponse(MapToDto(invoice), $"Bill {invoice.InvoiceNumber} updated."));
    }

    // GET /api/invoices — list bills (newest first)
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<InvoiceDto>>>> GetInvoices(
        [FromQuery] int? year,
        [FromQuery] string? search,
        [FromQuery] bool includeDeleted = false)
    {
        var query = _db.Invoices.Include(i => i.Items).AsQueryable();

        if (includeDeleted)
            query = query.IgnoreQueryFilters();

        if (year.HasValue)
            query = query.Where(i => i.Year == year.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(i => i.InvoiceNumber.Contains(term) || i.CustomerName.Contains(term));
        }

        var invoices = await query
            .OrderByDescending(i => i.InvoiceDate)
            .ThenByDescending(i => i.Id)
            .ToListAsync();

        return Ok(ApiResponse<List<InvoiceDto>>.SuccessResponse(invoices.Select(MapToDto).ToList()));
    }

    // GET /api/invoices/{id} — single bill
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> GetInvoice(int id)
    {
        var invoice = await _db.Invoices.IgnoreQueryFilters()
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null)
            return NotFound(ApiResponse<InvoiceDto>.ErrorResponse("Bill not found."));

        return Ok(ApiResponse<InvoiceDto>.SuccessResponse(MapToDto(invoice)));
    }

    // DELETE /api/invoices/{id} — soft delete (keeps the number, restorable)
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteInvoice(int id)
    {
        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Bill not found."));

        invoice.IsDeleted = true;
        invoice.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, $"Bill {invoice.InvoiceNumber} deleted."));
    }

    // POST /api/invoices/{id}/restore — undo a soft delete
    [HttpPost("{id}/restore")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> RestoreInvoice(int id)
    {
        var invoice = await _db.Invoices.IgnoreQueryFilters()
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null)
            return NotFound(ApiResponse<InvoiceDto>.ErrorResponse("Bill not found."));

        invoice.IsDeleted = false;
        invoice.DeletedAt = null;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<InvoiceDto>.SuccessResponse(MapToDto(invoice), $"Bill {invoice.InvoiceNumber} restored."));
    }

    // GET /api/invoices/{id}/pdf?columns=item,qty,price,total — download branded PDF
    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetInvoicePdf(int id, [FromQuery] string? columns)
    {
        var invoice = await _db.Invoices.IgnoreQueryFilters()
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Bill not found."));

        var selected = ParseColumns(columns);
        var pdfBytes = BuildPdf(invoice, selected);
        var fileName = $"{invoice.InvoiceNumber}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static string? Validate(SaveInvoiceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName))
            return "Customer name is required.";
        if (request.Items == null || request.Items.Count == 0)
            return "Add at least one item.";
        if (request.Items.Any(i => string.IsNullOrWhiteSpace(i.ItemName)))
            return "Every item needs a name.";
        if (request.Items.Any(i => i.Quantity <= 0))
            return "Every item quantity must be at least 1.";
        if (request.Items.Any(i => i.UnitPrice <= 0))
            return "Every item price must be greater than zero.";
        if (request.Items.Any(i => i.CostPrice < 0))
            return "Cost price cannot be negative.";
        if (request.Shipping < 0)
            return "Shipping cannot be negative.";
        return null;
    }

    private static InvoiceItem BuildItem(InvoiceItemRequest r) => new()
    {
        ItemName = r.ItemName.Trim(),
        ProductId = r.ProductId,
        CostPrice = r.CostPrice,
        MarginPercent = r.MarginPercent,
        UnitPrice = r.UnitPrice,
        Quantity = r.Quantity,
        LineTotal = r.UnitPrice * r.Quantity
    };

    private static void ApplyTotals(Invoice invoice)
    {
        invoice.Subtotal = invoice.Items.Sum(i => i.LineTotal);
        invoice.TotalCost = invoice.Items.Sum(i => i.CostPrice * i.Quantity);
        invoice.GrandTotal = invoice.Subtotal + invoice.Shipping;
        invoice.TotalProfit = invoice.Subtotal - invoice.TotalCost;
    }

    private static List<string> ParseColumns(string? columns)
    {
        if (string.IsNullOrWhiteSpace(columns))
            return DefaultColumns.ToList();

        var parsed = columns.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(c => c.ToLowerInvariant())
            .Where(ValidColumns.Contains)
            .Distinct()
            .ToList();

        // Always keep the item column and at least one value column.
        if (!parsed.Contains("item")) parsed.Insert(0, "item");
        if (parsed.Count == 1) parsed.AddRange(new[] { "qty", "price", "total" });
        return parsed;
    }

    private static InvoiceDto MapToDto(Invoice i) => new()
    {
        Id = i.Id,
        InvoiceNumber = i.InvoiceNumber,
        CustomerName = i.CustomerName,
        CustomerPhone = i.CustomerPhone,
        InvoiceDate = i.InvoiceDate,
        Subtotal = i.Subtotal,
        Shipping = i.Shipping,
        GrandTotal = i.GrandTotal,
        TotalCost = i.TotalCost,
        TotalProfit = i.TotalProfit,
        Notes = i.Notes,
        IsDeleted = i.IsDeleted,
        DeletedAt = i.DeletedAt,
        CreatedAt = i.CreatedAt,
        Items = i.Items.Select(it => new InvoiceItemDto
        {
            Id = it.Id,
            ItemName = it.ItemName,
            ProductId = it.ProductId,
            CostPrice = it.CostPrice,
            MarginPercent = it.MarginPercent,
            UnitPrice = it.UnitPrice,
            Quantity = it.Quantity,
            LineTotal = it.LineTotal
        }).ToList()
    };

    // ─── PDF ─────────────────────────────────────────────────────────────────

    private byte[] BuildPdf(Invoice invoice, List<string> columns)
    {
        byte[]? logo = TryLoadLogo();

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(t => t.FontSize(10).FontColor("#333333"));

                // ── Header ──────────────────────────────────────────────────
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        if (logo != null)
                            row.ConstantItem(60).Height(60).Image(logo).FitArea();

                        row.RelativeItem().PaddingLeft(logo != null ? 12 : 0).Column(info =>
                        {
                            info.Item().Text("Dhanak Trinket").FontSize(20).Bold().FontColor("#7c3aed");
                            info.Item().Text("Ethnic Finds, Timeless Shine").FontSize(9).FontColor("#888888");
                        });

                        row.ConstantItem(180).AlignRight().Column(meta =>
                        {
                            meta.Item().AlignRight().Text("INVOICE").FontSize(16).Bold().FontColor("#7c3aed");
                            meta.Item().PaddingTop(6).AlignRight().Text(t =>
                            {
                                t.Span("No.  ").FontSize(9).FontColor("#999999");
                                t.Span(invoice.InvoiceNumber).FontSize(11).SemiBold();
                            });
                            meta.Item().PaddingTop(2).AlignRight().Text(t =>
                            {
                                t.Span("Date  ").FontSize(9).FontColor("#999999");
                                t.Span(invoice.InvoiceDate.ToString("dd MMM yyyy")).FontSize(10).FontColor("#444444");
                            });
                        });
                    });

                    col.Item().PaddingTop(8).LineHorizontal(1).LineColor("#e5e0f5");

                    col.Item().PaddingTop(8).Column(bill =>
                    {
                        bill.Item().Text("Bill To").FontSize(9).FontColor("#888888");
                        bill.Item().PaddingTop(1).Text(invoice.CustomerName).FontSize(13).Bold().FontColor("#222222");
                        if (!string.IsNullOrWhiteSpace(invoice.CustomerPhone))
                            bill.Item().Text(invoice.CustomerPhone!).FontSize(9).FontColor("#666666");
                    });
                });

                // ── Content: items table + totals ───────────────────────────
                page.Content().PaddingTop(14).Column(content =>
                {
                    content.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            foreach (var c in columns)
                            {
                                if (c == "item") cols.RelativeColumn(3);
                                else cols.RelativeColumn(1);
                            }
                        });

                        table.Header(header =>
                        {
                            foreach (var c in columns)
                            {
                                var cell = header.Cell().Background("#f3f0fb").Padding(6);
                                if (c == "item")
                                    cell.Text(HeaderLabel(c)).SemiBold();
                                else
                                    cell.AlignRight().Text(HeaderLabel(c)).SemiBold();
                            }
                        });

                        foreach (var it in invoice.Items)
                        {
                            foreach (var c in columns)
                            {
                                var cell = table.Cell().BorderBottom(1).BorderColor("#eeeeee").Padding(6);
                                if (c == "item")
                                    cell.Text(it.ItemName);
                                else
                                    cell.AlignRight().Text(CellValue(c, it));
                            }
                        }
                    });

                    // Totals block (right-aligned)
                    content.Item().PaddingTop(12).AlignRight().Width(240).Column(totals =>
                    {
                        TotalRow(totals, "Subtotal", Money(invoice.Subtotal), false);
                        if (invoice.Shipping > 0)
                            TotalRow(totals, "Shipping", Money(invoice.Shipping), false);
                        totals.Item().PaddingTop(4).LineHorizontal(1).LineColor("#e5e0f5");
                        TotalRow(totals, "Grand Total", Money(invoice.GrandTotal), true);

                        // Internal figures only when explicitly exported
                        if (columns.Contains("profit") || columns.Contains("cost"))
                        {
                            totals.Item().PaddingTop(8).Text("Internal — do not share").FontSize(8).FontColor("#b91c1c");
                            TotalRow(totals, "Total Cost", Money(invoice.TotalCost), false);
                            TotalRow(totals, "Total Profit", Money(invoice.TotalProfit), false);
                        }
                    });

                    if (!string.IsNullOrWhiteSpace(invoice.Notes))
                    {
                        content.Item().PaddingTop(16).Column(notes =>
                        {
                            notes.Item().Text("Notes").FontSize(9).FontColor("#888888");
                            notes.Item().Text(invoice.Notes!).FontSize(9);
                        });
                    }
                });

                // ── Footer ──────────────────────────────────────────────────
                page.Footer().PaddingTop(10).Column(footer =>
                {
                    footer.Item().LineHorizontal(1).LineColor("#e5e0f5");
                    footer.Item().PaddingTop(6).AlignCenter().Text("Thank you for shopping with Dhanak Trinket 💛")
                        .FontSize(10).FontColor("#7c3aed").SemiBold();
                    footer.Item().PaddingTop(3).AlignCenter().Text(t =>
                    {
                        t.Span("Instagram ").FontSize(8).FontColor("#888888");
                        t.Span("@dhanaktrinket").FontSize(8).FontColor("#7c3aed").SemiBold();
                        t.Span("   ·   WhatsApp ").FontSize(8).FontColor("#888888");
                        t.Span("chat.whatsapp.com/Bs6ue8BYGiY7xeZ7wk5EE8").FontSize(8).FontColor("#7c3aed").SemiBold();
                    });
                    footer.Item().AlignCenter().Text("dhanaktrinket.in").FontSize(8).FontColor("#999999");
                });
            });
        });

        return doc.GeneratePdf();
    }

    private static void TotalRow(ColumnDescriptor col, string label, string value, bool emphasize)
    {
        col.Item().Row(row =>
        {
            var left = row.RelativeItem().Text(label);
            var right = row.ConstantItem(110).AlignRight().Text(value);
            if (emphasize)
            {
                left.SemiBold().FontSize(12);
                right.Bold().FontSize(12).FontColor("#7c3aed");
            }
        });
    }

    private static string HeaderLabel(string c) => c switch
    {
        "item" => "Item",
        "qty" => "Qty",
        "price" => "Price",
        "total" => "Total",
        "cost" => "Cost",
        "margin" => "Margin %",
        "profit" => "Profit",
        _ => c
    };

    private static string CellValue(string c, InvoiceItem it) => c switch
    {
        "qty" => it.Quantity.ToString(),
        "price" => Money(it.UnitPrice),
        "total" => Money(it.LineTotal),
        "cost" => Money(it.CostPrice),
        "margin" => it.MarginPercent.HasValue ? $"{it.MarginPercent.Value:0.##}%" : "—",
        "profit" => Money((it.UnitPrice - it.CostPrice) * it.Quantity),
        _ => string.Empty
    };

    private static string Money(decimal value) => "₹" + value.ToString("N0");

    private byte[]? TryLoadLogo()
    {
        try
        {
            var root = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var path = Path.Combine(root, "logo.jpg");
            return System.IO.File.Exists(path) ? System.IO.File.ReadAllBytes(path) : null;
        }
        catch
        {
            return null;
        }
    }
}
