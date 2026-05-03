using System.ComponentModel.DataAnnotations;

namespace DhanakTrinket.Core.Entities;

/// <summary>
/// Records a business expense — inventory purchase, packaging, shipping, etc.
/// Bill image is optional (stored in blob storage).
/// </summary>
public class Expense
{
    public int Id { get; set; }

    public DateTime ExpenseDate { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public ExpenseCategory Category { get; set; }

    [MaxLength(255)]
    public string? VendorName { get; set; }

    /// <summary>Blob path for uploaded bill image (optional)</summary>
    [MaxLength(500)]
    public string? BillImagePath { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
}

public enum ExpenseCategory
{
    InventoryPurchase = 1,   // Main — bought items from wholesale market
    Packaging = 2,
    Shipping = 3,
    Marketing = 4,
    Other = 5
}
