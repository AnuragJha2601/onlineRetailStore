using System.ComponentModel.DataAnnotations;

namespace DhanakTrinket.Core.Entities;

/// <summary>
/// Records a retail or wholesale sale.
///
/// WHOLESALE DESIGN NOTE (future):
/// Currently a wholesale deal is a single Sale row with SaleType=Wholesale,
/// a description in Notes, and BuyerName/BuyerPhone here.
/// When multi-line-item wholesale is built, introduce a WholesaleOrder header
/// table and rename/repurpose this entity as a line item:
///   WholesaleOrder  { Id, BuyerName, BuyerPhone, OrderDate, TotalAmount, Notes }
///   Sale            { ..., WholesaleOrderId? (FK to WholesaleOrder) }
/// Until then, keeping it flat avoids a useless join table.
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
}

public enum SaleType
{
    Retail = 1,    // Single item / regular sale
    Wholesale = 2  // Bulk deal — items described in Notes
}
