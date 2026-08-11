using System.ComponentModel.DataAnnotations;

namespace DhanakTrinket.Core.Entities;

/// <summary>
/// A single line on an <see cref="Invoice"/>.
/// CostPrice and MarginPercent are internal (admin-only) — used to compute
/// profit and never shown on the customer-facing PDF.
/// </summary>
public class InvoiceItem
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }

    [Required]
    [MaxLength(255)]
    public string ItemName { get; set; } = string.Empty;

    /// <summary>Optional reference to a catalog product (no FK — item name is stored denormalised).</summary>
    public int? ProductId { get; set; }

    // ── Internal (admin-only) ──────────────────────────────────────────────
    /// <summary>Buying cost per unit (typed at billing time).</summary>
    public decimal CostPrice { get; set; }

    /// <summary>Margin % applied to derive UnitPrice (nullable — price may be hand-set).</summary>
    public decimal? MarginPercent { get; set; }

    // ── Customer-facing ────────────────────────────────────────────────────
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal LineTotal { get; set; }

    // Navigation
    public virtual Invoice Invoice { get; set; } = null!;
}
