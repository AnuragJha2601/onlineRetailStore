using DhanakTrinket.Core.Entities;

namespace DhanakTrinket.Core.Interfaces;

public interface IProductRepository
{
    Task<IEnumerable<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product?> GetByCodeAsync(string productCode);
    Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId);
    Task<IEnumerable<Product>> SearchAsync(string searchTerm);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task IncrementLikesAsync(int id);
    Task AddProductImageAsync(ProductImage image);
}

public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(int id);
    Task<Category> CreateAsync(Category category);
    Task<Category> UpdateAsync(Category category);
    Task DeleteAsync(int id);
    Task<bool> HasProductsAsync(int id);
}

public interface ISubCategoryRepository
{
    Task<IEnumerable<SubCategory>> GetByCategoryAsync(int categoryId);
    Task<SubCategory?> GetByIdAsync(int id);
    Task<SubCategory> CreateAsync(SubCategory subCategory);
    Task<SubCategory> UpdateAsync(SubCategory subCategory);
    Task DeleteAsync(int id);
    Task<bool> HasProductsAsync(int id);
}

public interface IProductService
{
    Task<IEnumerable<Product>> GetAllProductsAsync();
    Task<Product?> GetProductByIdAsync(int id);
    Task<Product?> GetProductByCodeAsync(string productCode);
    Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId);
    Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm);
    Task<Product> CreateProductAsync(Product product);
    Task<Product> UpdateProductAsync(Product product);
    Task DeleteProductAsync(int id);
    Task LikeProductAsync(int id);
    Task AddProductImageAsync(ProductImage image);
}

public interface IBlobStorageService
{
    Task<string> UploadImageAsync(Stream imageStream, string fileName, string containerName = "product-images");
    Task<string> UploadThumbnailPublicAsync(Stream imageStream, string fileName);
    Task DeleteImageAsync(string blobPath);
    Task<string> GetImageUrlAsync(string blobPath);
    string GenerateSasUrl(string blobPath);
}