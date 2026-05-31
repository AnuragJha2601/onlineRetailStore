using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;
using DhanakTrinket.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DhanakTrinket.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly DhanakTrinketDbContext _context;

    public ProductRepository(DhanakTrinketDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        return await _context.Products
            .Include(p => p.Images)
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _context.Products
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Product?> GetByCodeAsync(string productCode)
    {
        return await _context.Products
            .Include(p => p.Images)
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .FirstOrDefaultAsync(p => p.ProductCode != null &&
                p.ProductCode.ToLower() == productCode.Trim().ToLower());
    }

    public async Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId)
    {
        return await _context.Products
            .Include(p => p.Images)
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .Where(p => p.CategoryId == categoryId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> SearchAsync(string searchTerm)
    {
        return await _context.Products
            .Include(p => p.Images)
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .Where(p => p.Name.Contains(searchTerm) ||
                       p.Description.Contains(searchTerm) ||
                       (p.ProductCode != null && p.ProductCode.Contains(searchTerm)))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Product> CreateAsync(Product product)
    {
        product.CreatedAt = DateTime.UtcNow;
        product.UpdatedAt = DateTime.UtcNow;

        // Auto-generate ProductCode if not provided
        if (string.IsNullOrWhiteSpace(product.ProductCode))
            product.ProductCode = await GenerateProductCodeAsync(product.CategoryId);

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Reload with images
        return await GetByIdAsync(product.Id) ?? product;
    }

    private async Task<string> GenerateProductCodeAsync(int categoryId)
    {
        // Build prefix from the first 1-2 letters of the category name
        var category = await _context.Categories.FindAsync(categoryId);
        var prefix = category != null ? category.Name[..Math.Min(2, category.Name.Length)].ToUpper() : "X";
        // Find highest existing sequence number for this prefix
        var existing = await _context.Products
            .Where(x => x.ProductCode != null && x.ProductCode.StartsWith(prefix))
            .Select(x => x.ProductCode!)
            .ToListAsync();
        var max = existing
            .Select(code => { var num = code[prefix.Length..]; return int.TryParse(num, out var n) ? n : 0; })
            .DefaultIfEmpty(0)
            .Max();
        return $"{prefix}{max + 1:D2}";
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        product.UpdatedAt = DateTime.UtcNow;

        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(product.Id) ?? product;
    }

    public async Task DeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product != null)
        {
            // Soft delete
            product.IsDeleted = true;
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Products.AnyAsync(p => p.Id == id);
    }

    public async Task IncrementLikesAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product != null)
        {
            product.LikesCount++;
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task AddProductImageAsync(DhanakTrinket.Core.Entities.ProductImage image)
    {
        _context.ProductImages.Add(image);
        await _context.SaveChangesAsync();
    }
}