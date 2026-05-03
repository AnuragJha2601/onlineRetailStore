using System.ComponentModel.DataAnnotations;

namespace DhanakTrinket.Core.Entities;

/// <summary>
/// Records a retail or wholesale sale. Created when admin clicks "Mark as Sold" on a product.
/// </summary>
public class Sale
{
    public int Id { get; set; }

    // Link to product (nullable in case product is deleted later)
    public int? ProductId { get; set; }

    // Stored separately so history is preserved even if product name changes
    [Required]
    [MaxLength(255)]
    public string ProductName { get; set; } = string.Empty;

    public SaleType SaleType { get; set; }

    public int QuantitySold { get; set; } = 1;

    // Price actually sold at (may differ from catalog price for negotiated/wholesale deals)
    [Required]
    public decimal SellingPrice { get; set; }

    // Total = QuantitySold * SellingPrice (stored for quick queries)
    public decimal TotalAmount { get; set; }

    public DateTime SaleDate { get; set; }

    // For wholesale: link to a bulk deal grouping
    public int? WholesaleDealId { get; set; }

    // Optional customer info
    [MaxLength(255)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    [MaxLength(100)]
    public string? SaleChannel { get; set; } // Website, WhatsApp, Instagram, InPerson

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Product? Product { get; set; }
    public virtual WholesaleDeal? WholesaleDeal { get; set; }
}

public enum SaleType
{
    Retail = 1,    // Single item / regular sale
    Wholesale = 2  // Part of a bulk deal
}

/// <summary>
/// Groups multiple Sale records under one wholesale bulk deal.
/// </summary>
public class WholesaleDeal
{
    public int Id { get; set; }

    [MaxLength(255)]
    public string? BuyerName { get; set; }

    [MaxLength(20)]
    public string? BuyerPhone { get; set; }

    public DateTime DealDate { get; set; }

    // Computed from linked Sales on save
    public decimal TotalAmount { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation
    public virtual ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
