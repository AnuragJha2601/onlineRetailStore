using System.ComponentModel.DataAnnotations;

namespace DhanakTrinket.Core.Entities;

public class Product
{
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public ProductCategory Category { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    public bool IsInStock { get; set; } = true;

    public int StockQuantity { get; set; } = 0;

    public int LikesCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; } = false;

    // Navigation properties
    public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}

public enum ProductCategory
{
    Bangles = 1,
    Necklaces = 2,
    Earrings = 3,
    Bracelets = 4,
    Rings = 5,
    Sets = 6,
    Anklets = 7,
    HairAccessories = 8,
    Pendants = 9,
    Chains = 10
}

public class ProductImage
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(500)]
    public string BlobPath { get; set; } = string.Empty;

    [MaxLength(255)]
    public string AltText { get; set; } = string.Empty;

    public bool IsPrimary { get; set; } = false;

    public int DisplayOrder { get; set; } = 0;

    [MaxLength(500)]
    public string? ThumbnailBlobPath { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation property
    public virtual Product Product { get; set; } = null!;
}