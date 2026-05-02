using DhanakTrinket.Core.Entities;

namespace DhanakTrinket.Core.Interfaces;

public interface IProductRepository
{
    Task<IEnumerable<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<IEnumerable<Product>> GetByCategoryAsync(ProductCategory category);
    Task<IEnumerable<Product>> SearchAsync(string searchTerm);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task IncrementLikesAsync(int id);
    Task AddProductImageAsync(ProductImage image);
}

public interface IProductService
{
    Task<IEnumerable<Product>> GetAllProductsAsync();
    Task<Product?> GetProductByIdAsync(int id);
    Task<IEnumerable<Product>> GetProductsByCategoryAsync(ProductCategory category);
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
    Task DeleteImageAsync(string blobPath);
    Task<string> GetImageUrlAsync(string blobPath);
}