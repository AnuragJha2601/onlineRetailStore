namespace DhanakTrinket.Core.DTOs;

// ─── Invoice / Billing DTOs ──────────────────────────────────────────────────

/// <summary>One line item in a create/update invoice request.</summary>
public class InvoiceItemRequest
{
    public string ItemName { get; set; } = string.Empty;
    public int? ProductId { get; set; }
    public decimal CostPrice { get; set; }
    public decimal? MarginPercent { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
}

/// <summary>Create or update an invoice. Totals are recomputed server-side.</summary>
public class SaveInvoiceRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public decimal Shipping { get; set; }
    public string? Notes { get; set; }
    public List<InvoiceItemRequest> Items { get; set; } = new();
}

/// <summary>Admin-only line item DTO (includes cost/margin).</summary>
public class InvoiceItemDto
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int? ProductId { get; set; }
    public decimal CostPrice { get; set; }
    public decimal? MarginPercent { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}

/// <summary>Admin-only invoice DTO. Includes internal cost/profit — never public, never in PDF.</summary>
public class InvoiceDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public DateTime InvoiceDate { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Shipping { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalProfit { get; set; }
    public string? Notes { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new();
}
