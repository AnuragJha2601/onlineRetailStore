using System.ComponentModel.DataAnnotations;

namespace DhanakTrinket.Core.Entities;

/// <summary>
/// Records a retail or bulk sale.
/// For bulk sales, optional line items are stored in <see cref="BulkSaleItems"/>.
/// If no line items are provided the sale is recorded in summary mode
/// (total amount + description in Notes — the original flat behaviour).
/// </summary>
public class Sale
{
    public int Id { get; set; }

    // Link to catalog product (null for custom items / wholesale summaries)
    public int? ProductId { get; set; }

    // Stored separately so history survives product renames/deletes
    [Required]
    [MaxLength(255)]
    public string ProductName { get; set; } = string.Empty;

    public SaleType SaleType { get; set; }

    public int QuantitySold { get; set; } = 1;

    // Price actually sold at (may differ from catalog price for negotiated deals)
    [Required]
    public decimal SellingPrice { get; set; }

    // Total = QuantitySold * SellingPrice (stored for quick queries)
    public decimal TotalAmount { get; set; }

    public DateTime SaleDate { get; set; }

    // Retail: customer info
    [MaxLength(255)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    [MaxLength(100)]
    public string? SaleChannel { get; set; } // Website, WhatsApp, Instagram, InPerson

    // Wholesale: buyer info (same concept as customer, kept separate for clarity in UI)
    [MaxLength(255)]
    public string? BuyerName { get; set; }

    [MaxLength(20)]
    public string? BuyerPhone { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation
    public virtual Product? Product { get; set; }
    public virtual ICollection<BulkSaleItem> BulkSaleItems { get; set; } = new List<BulkSaleItem>();
}

public enum SaleType
{
    Retail = 1,    // Single item / regular sale
    BulkSale = 2   // Bulk deal — line items in BulkSaleItems (or summary in Notes)
}
