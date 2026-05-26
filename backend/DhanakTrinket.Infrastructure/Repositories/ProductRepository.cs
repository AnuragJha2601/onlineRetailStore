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
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _context.Products
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Product?> GetByCodeAsync(string productCode)
    {
        return await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.ProductCode != null &&
                p.ProductCode.ToLower() == productCode.Trim().ToLower());
    }

    public async Task<IEnumerable<Product>> GetByCategoryAsync(ProductCategory category)
    {
        return await _context.Products
            .Include(p => p.Images)
            .Where(p => p.Category == category)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> SearchAsync(string searchTerm)
    {
        return await _context.Products
            .Include(p => p.Images)
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
            product.ProductCode = await GenerateProductCodeAsync(product.Category);

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Reload with images
        return await GetByIdAsync(product.Id) ?? product;
    }

    private static readonly Dictionary<ProductCategory, string> _categoryPrefixes = new()
    {
        { ProductCategory.Bangles,          "B"  },
        { ProductCategory.Necklaces,        "N"  },
        { ProductCategory.Earrings,         "E"  },
        { ProductCategory.Bracelets,        "BR" },
        { ProductCategory.Rings,            "R"  },
        { ProductCategory.Sets,             "S"  },
        { ProductCategory.Anklets,          "A"  },
        { ProductCategory.HairAccessories,  "H"  },
        { ProductCategory.Pendants,         "P"  },
        { ProductCategory.Chains,           "C"  },
    };

    private async Task<string> GenerateProductCodeAsync(ProductCategory category)
    {
        var prefix = _categoryPrefixes.TryGetValue(category, out var p) ? p : "X";
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