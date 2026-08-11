using System.ComponentModel.DataAnnotations;

namespace DhanakTrinket.Core.Entities;

/// <summary>
/// A customer bill / invoice. Header + line items.
/// Cost/margin/profit fields are internal (admin-only) and must never appear
/// on a public endpoint or in the customer-facing PDF.
/// Soft-deleted via <see cref="IsDeleted"/> so bill numbers are never reused.
/// </summary>
public class Invoice
{
    public int Id { get; set; }

    /// <summary>Human-readable bill number, e.g. DT-2026-0042. Unique.</summary>
    [Required]
    [MaxLength(30)]
    public string InvoiceNumber { get; set; } = string.Empty;

    /// <summary>Year the bill belongs to (used for the per-year sequence reset).</summary>
    public int Year { get; set; }

    /// <summary>Sequence within the year (1-based). Combined with Year to form InvoiceNumber.</summary>
    public int SequenceNumber { get; set; }

    [Required]
    [MaxLength(255)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    public DateTime InvoiceDate { get; set; }

    // ── Customer-facing totals ─────────────────────────────────────────────
    public decimal Subtotal { get; set; }
    public decimal Shipping { get; set; }
    public decimal GrandTotal { get; set; }

    // ── Internal (admin-only) totals ───────────────────────────────────────
    public decimal TotalCost { get; set; }
    public decimal TotalProfit { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    // ── Soft delete ────────────────────────────────────────────────────────
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public virtual ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}
