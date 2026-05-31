using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;
using DhanakTrinket.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DhanakTrinket.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly DhanakTrinketDbContext _context;

    public CategoryRepository(DhanakTrinketDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Category>> GetAllAsync()
    {
        return await _context.Categories
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Category?> GetByIdAsync(int id)
    {
        return await _context.Categories.FindAsync(id);
    }

    public async Task<Category> CreateAsync(Category category)
    {
        category.CreatedAt = DateTime.UtcNow;
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task<Category> UpdateAsync(Category category)
    {
        _context.Categories.Update(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task DeleteAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category != null)
        {
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> HasProductsAsync(int id)
    {
        return await _context.Products.AnyAsync(p => p.CategoryId == id);
    }
}
