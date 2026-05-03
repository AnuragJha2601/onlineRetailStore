using DhanakTrinket.Core.Entities;

namespace DhanakTrinket.Core.DTOs;

// Auth DTOs
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
}

// API Response wrapper
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();

    public static ApiResponse<T> SuccessResponse(T data, string message = "")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }

    public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>()
        };
    }
}

// Product DTOs
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsInStock { get; set; }
    public int StockQuantity { get; set; }
    public int LikesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ProductImageDto> Images { get; set; } = new();
}

public class CreateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductCategory Category { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; } = 1;
    public bool IsInStock { get; set; } = true;
}

public class UpdateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductCategory Category { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public bool IsInStock { get; set; }
}

public class ProductImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string AltText { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int DisplayOrder { get; set; }
}

// Request DTOs
public class ProductFilterRequest
{
    public ProductCategory? Category { get; set; }
    public string? SearchTerm { get; set; }
    public bool? InStockOnly { get; set; } = true;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ─── Sales DTOs ──────────────────────────────────────────────────────────────

public class RecordSaleRequest
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public SaleType SaleType { get; set; } = SaleType.Retail;
    public int QuantitySold { get; set; } = 1;
    public decimal SellingPrice { get; set; }
    public DateTime SaleDate { get; set; } = DateTime.UtcNow;

    // Wholesale only
    public string? BuyerName { get; set; }
    public string? BuyerPhone { get; set; }

    // Optional
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? SaleChannel { get; set; }
    public string? Notes { get; set; }
}

public class SaleDto
{
    public int Id { get; set; }
    public int? ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SaleType { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime SaleDate { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? SaleChannel { get; set; }
    public string? Notes { get; set; }
    public int? WholesaleDealId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SalesSummaryDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal TotalRevenue { get; set; }
    public int TotalItemsSold { get; set; }
    public int RetailCount { get; set; }
    public int WholesaleCount { get; set; }
    public List<SaleDto> Sales { get; set; } = new();
}