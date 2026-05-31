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

    /// <summary>FK to Categories table (was previously ProductCategory enum stored as int).</summary>
    public int CategoryId { get; set; }

    /// <summary>Optional dynamic sub-category (e.g. "AntiTarnish" under Chains).</summary>
    public int? SubCategoryId { get; set; }

    /// <summary>Short unique code e.g. B01, N03. Auto-generated if not provided.</summary>
    [MaxLength(10)]
    public string? ProductCode { get; set; }

    /// <summary>Retail / MRP price shown on website.</summary>
    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    /// <summary>Pari channel price.</summary>
    public decimal? PariFestPrice { get; set; }

    /// <summary>Wholesale price.</summary>
    public decimal? WholesalePrice { get; set; }

    public bool IsInStock { get; set; } = true;

    public int StockQuantity { get; set; } = 0;

    public int LikesCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; } = false;

    // Navigation properties
    public virtual Category Category { get; set; } = null!;
    public virtual SubCategory? SubCategory { get; set; }
    public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}

/// <summary>Dynamic category (e.g. Bangles, Necklaces, Chains). Admin can add new ones.</summary>
public class Category
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
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
    public string? ThumbnailUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation property
    public virtual Product Product { get; set; } = null!;
}

/// <summary>Dynamic sub-category linked to a Category (e.g. "AntiTarnish" under Chains).</summary>
public class SubCategory
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Parent category FK.</summary>
    public int CategoryId { get; set; }

    public virtual Category Category { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}