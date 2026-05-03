using DhanakTrinket.Core.DTOs;
using DhanakTrinket.Core.Entities;
using DhanakTrinket.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly DhanakTrinketDbContext _db;

    public SalesController(DhanakTrinketDbContext db)
    {
        _db = db;
    }

    // POST /api/sales — record a sale (admin marks product as sold)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SaleDto>>> RecordSale([FromBody] RecordSaleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProductName))
            return BadRequest(ApiResponse<SaleDto>.ErrorResponse("Product name is required."));

        bool hasLineItems = request.Items is { Count: > 0 };

        if (request.SaleType == SaleType.Retail || !hasLineItems)
        {
            if (request.QuantitySold <= 0)
                return BadRequest(ApiResponse<SaleDto>.ErrorResponse("Quantity must be at least 1."));
            if (request.SellingPrice <= 0)
                return BadRequest(ApiResponse<SaleDto>.ErrorResponse("Selling price must be greater than zero."));
        }

        if (hasLineItems)
        {
            if (request.Items!.Any(i => string.IsNullOrWhiteSpace(i.Description)))
                return BadRequest(ApiResponse<SaleDto>.ErrorResponse("Each line item must have a description."));
            if (request.Items.Any(i => i.Quantity <= 0))
                return BadRequest(ApiResponse<SaleDto>.ErrorResponse("Each item quantity must be at least 1."));
            if (request.Items.Any(i => i.UnitPrice <= 0))
                return BadRequest(ApiResponse<SaleDto>.ErrorResponse("Each item unit price must be greater than zero."));
        }

        // Look up the catalog product only when ProductId is provided
        DhanakTrinket.Core.Entities.Product? product = null;
        if (request.ProductId.HasValue)
        {
            product = await _db.Products.FindAsync(request.ProductId.Value);
            if (product == null)
                return NotFound(ApiResponse<SaleDto>.ErrorResponse("Product not found."));
        }

        // Compute totals
        int quantitySold;
        decimal sellingPrice;
        decimal totalAmount;

        if (hasLineItems)
        {
            quantitySold = request.Items!.Sum(i => i.Quantity);
            totalAmount = request.Items.Sum(i => i.Quantity * i.UnitPrice);
            sellingPrice = 0; // no single unit price for multi-item bulk sale
        }
        else
        {
            quantitySold = request.QuantitySold;
            sellingPrice = request.SellingPrice;
            totalAmount = request.QuantitySold * request.SellingPrice;
        }

        var sale = new Sale
        {
            ProductId = request.ProductId,
            ProductName = product?.Name ?? request.ProductName,
            SaleType = request.SaleType,
            QuantitySold = quantitySold,
            SellingPrice = sellingPrice,
            TotalAmount = totalAmount,
            SaleDate = request.SaleDate,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            SaleChannel = request.SaleChannel,
            BuyerName = request.BuyerName,
            BuyerPhone = request.BuyerPhone,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        if (hasLineItems)
        {
            sale.BulkSaleItems = request.Items!.Select(i => new BulkSaleItem
            {
                Description = i.Description.Trim(),
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.Quantity * i.UnitPrice
            }).ToList();
        }

        _db.Sales.Add(sale);

        // Reduce stock only for catalog products
        if (product != null)
        {
            product.StockQuantity = Math.Max(0, product.StockQuantity - quantitySold);
            if (product.StockQuantity == 0)
                product.IsInStock = false;
            product.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse<SaleDto>.SuccessResponse(MapToDto(sale), "Sale recorded successfully."));
    }

    // GET /api/sales — list all sales (admin only)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<SaleDto>>>> GetSales(
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] SaleType? saleType)
    {
        var query = _db.Sales.Include(s => s.BulkSaleItems).AsQueryable();

        if (year.HasValue)
            query = query.Where(s => s.SaleDate.Year == year.Value);
        if (month.HasValue)
            query = query.Where(s => s.SaleDate.Month == month.Value);
        if (saleType.HasValue)
            query = query.Where(s => s.SaleType == saleType.Value);

        var sales = await query.OrderByDescending(s => s.SaleDate).ToListAsync();

        return Ok(ApiResponse<List<SaleDto>>.SuccessResponse(sales.Select(MapToDto).ToList()));
    }

    // GET /api/sales/summary?year=2026 — monthly P&L summary
    [HttpGet("summary")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<SalesSummaryDto>>>> GetMonthlySummary([FromQuery] int? year)
    {
        int targetYear = year ?? DateTime.UtcNow.Year;

        var sales = await _db.Sales
            .Where(s => s.SaleDate.Year == targetYear)
            .ToListAsync();

        var summary = sales
            .GroupBy(s => s.SaleDate.Month)
            .Select(g => new SalesSummaryDto
            {
                Year = targetYear,
                Month = g.Key,
                MonthName = new DateTime(targetYear, g.Key, 1).ToString("MMMM"),
                TotalRevenue = g.Sum(s => s.TotalAmount),
                TotalItemsSold = g.Sum(s => s.QuantitySold),
                RetailCount = g.Count(s => s.SaleType == SaleType.Retail),
                BulkSaleCount = g.Count(s => s.SaleType == SaleType.BulkSale),
                Sales = g.OrderByDescending(s => s.SaleDate).Select(MapToDto).ToList()
            })
            .OrderBy(s => s.Month)
            .ToList();

        return Ok(ApiResponse<List<SalesSummaryDto>>.SuccessResponse(summary));
    }

    // DELETE /api/sales/{id} — delete a sale (undo / correction)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteSale(int id)
    {
        var sale = await _db.Sales.Include(s => s.Product).Include(s => s.BulkSaleItems).FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Sale not found."));

        // Restore stock
        if (sale.Product != null)
        {
            sale.Product.StockQuantity += sale.QuantitySold;
            sale.Product.IsInStock = true;
            sale.Product.UpdatedAt = DateTime.UtcNow;
        }

        _db.Sales.Remove(sale);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(new { }, "Sale deleted and stock restored."));
    }

    private static SaleDto MapToDto(Sale s) => new()
    {
        Id = s.Id,
        ProductId = s.ProductId,
        ProductName = s.ProductName,
        SaleType = s.SaleType.ToString(),
        QuantitySold = s.QuantitySold,
        SellingPrice = s.SellingPrice,
        TotalAmount = s.TotalAmount,
        SaleDate = s.SaleDate,
        CustomerName = s.CustomerName,
        CustomerPhone = s.CustomerPhone,
        SaleChannel = s.SaleChannel,
        BuyerName = s.BuyerName,
        BuyerPhone = s.BuyerPhone,
        Notes = s.Notes,
        CreatedAt = s.CreatedAt,
        Items = s.BulkSaleItems.Select(i => new BulkSaleItemDto
        {
            Id = i.Id,
            Description = i.Description,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            TotalPrice = i.TotalPrice
        }).ToList()
    };
}
