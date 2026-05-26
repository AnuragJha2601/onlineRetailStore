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
    public string? ProductCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }          // Retail/MRP — public
    public bool IsInStock { get; set; }
    public int StockQuantity { get; set; }
    public int LikesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ProductImageDto> Images { get; set; } = new();
}

/// <summary>Admin-only DTO — includes channel prices (Pari, Wholesale) not shown publicly.</summary>
public class AdminProductDto : ProductDto
{
    public decimal? PariPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
}

public class CreateProductDto
{
    public string? ProductCode { get; set; }     // optional — auto-generated if blank
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductCategory Category { get; set; }
    public decimal Price { get; set; }           // MRP shown on website
    public decimal? PariPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int StockQuantity { get; set; } = 1;
    public bool IsInStock { get; set; } = true;
}

public class UpdateProductDto
{
    public string? ProductCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductCategory Category { get; set; }
    public decimal Price { get; set; }
    public decimal? PariPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int StockQuantity { get; set; }
    public bool IsInStock { get; set; }
}

public class ProductImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string AltText { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int DisplayOrder { get; set; }
}

// Request DTOs
public class ProductFilterRequest
{
    public ProductCategory? Category { get; set; }
    public string? SearchTerm { get; set; }
    public string? ProductCode { get; set; }     // exact code lookup
    public bool? InStockOnly { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ─── Sales DTOs ──────────────────────────────────────────────────────────────

public class BulkSaleItemRequest
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
}

public class RecordSaleRequest
{
    public int? ProductId { get; set; }          // null for custom items / bulk sales
    public string ProductName { get; set; } = string.Empty;
    public SaleType SaleType { get; set; } = SaleType.Retail;
    public int QuantitySold { get; set; } = 1;
    public decimal SellingPrice { get; set; }    // ignored when Items has values
    public DateTime SaleDate { get; set; } = DateTime.UtcNow;

    // Bulk sale only
    public string? BuyerName { get; set; }
    public string? BuyerPhone { get; set; }

    // Optional line items for bulk sales (if omitted → summary mode, uses SellingPrice)
    public List<BulkSaleItemRequest>? Items { get; set; }

    // Optional retail
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? SaleChannel { get; set; }
    public string? Notes { get; set; }
}

public class BulkSaleItemDto
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
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
    public string? BuyerName { get; set; }
    public string? BuyerPhone { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<BulkSaleItemDto> Items { get; set; } = new();
}

public class SalesSummaryDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal TotalRevenue { get; set; }
    public int TotalItemsSold { get; set; }
    public int RetailCount { get; set; }
    public int BulkSaleCount { get; set; }
    public List<SaleDto> Sales { get; set; } = new();
}

// ─── Expense DTOs ───────────────────────────────────────────────────────────

public class CreateExpenseRequest
{
    public DateTime ExpenseDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public ExpenseCategory Category { get; set; }
    public string? VendorName { get; set; }
    public string? Notes { get; set; }
}

public class ExpenseDto
{
    public int Id { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? VendorName { get; set; }
    public string? BillImageUrl { get; set; }   // SAS URL, null if no bill uploaded
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}