using System.ComponentModel.DataAnnotations;

namespace DhanakTrinket.Core.Entities;

/// <summary>
/// A single line item within a BulkSale.
/// Parent sale is referenced by SaleId.
/// </summary>
public class BulkSaleItem
{
    public int Id { get; set; }

    public int SaleId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public int Quantity { get; set; } = 1;

    public decimal UnitPrice { get; set; }

    // Stored denormalised to avoid recomputing in queries
    public decimal TotalPrice { get; set; }

    // Navigation
    public virtual Sale Sale { get; set; } = null!;
}
