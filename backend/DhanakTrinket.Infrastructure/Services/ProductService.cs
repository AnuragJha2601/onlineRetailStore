using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;

namespace DhanakTrinket.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<IEnumerable<Product>> GetAllProductsAsync()
    {
        return await _productRepository.GetAllAsync();
    }

    public async Task<Product?> GetProductByIdAsync(int id)
    {
        return await _productRepository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Product>> GetProductsByCategoryAsync(ProductCategory category)
    {
        return await _productRepository.GetByCategoryAsync(category);
    }

    public async Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return await GetAllProductsAsync();
        }

        return await _productRepository.SearchAsync(searchTerm.Trim());
    }

    public async Task<Product> CreateProductAsync(Product product)
    {
        // Business logic validation
        if (string.IsNullOrWhiteSpace(product.Name))
            throw new ArgumentException("Product name is required");

        if (product.Price <= 0)
            throw new ArgumentException("Product price must be greater than 0");

        return await _productRepository.CreateAsync(product);
    }

    public async Task<Product> UpdateProductAsync(Product product)
    {
        var existingProduct = await _productRepository.GetByIdAsync(product.Id);
        if (existingProduct == null)
            throw new ArgumentException($"Product with ID {product.Id} not found");

        // Business logic validation
        if (string.IsNullOrWhiteSpace(product.Name))
            throw new ArgumentException("Product name is required");

        if (product.Price <= 0)
            throw new ArgumentException("Product price must be greater than 0");

        // Update properties
        existingProduct.Name = product.Name;
        existingProduct.Description = product.Description;
        existingProduct.Category = product.Category;
        existingProduct.Price = product.Price;
        existingProduct.IsInStock = product.IsInStock;
        existingProduct.StockQuantity = product.StockQuantity;

        return await _productRepository.UpdateAsync(existingProduct);
    }

    public async Task DeleteProductAsync(int id)
    {
        var exists = await _productRepository.ExistsAsync(id);
        if (!exists)
            throw new ArgumentException($"Product with ID {id} not found");

        await _productRepository.DeleteAsync(id);
    }

    public async Task LikeProductAsync(int id)
    {
        var exists = await _productRepository.ExistsAsync(id);
        if (!exists)
            throw new ArgumentException($"Product with ID {id} not found");

        await _productRepository.IncrementLikesAsync(id);
    }

    public async Task AddProductImageAsync(DhanakTrinket.Core.Entities.ProductImage image)
    {
        await _productRepository.AddProductImageAsync(image);
    }
}