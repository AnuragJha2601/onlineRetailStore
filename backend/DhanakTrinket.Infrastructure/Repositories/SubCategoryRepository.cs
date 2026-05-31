using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;
using DhanakTrinket.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DhanakTrinket.Infrastructure.Repositories;

public class SubCategoryRepository : ISubCategoryRepository
{
    private readonly DhanakTrinketDbContext _context;

    public SubCategoryRepository(DhanakTrinketDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SubCategory>> GetByCategoryAsync(int categoryId)
    {
        return await _context.SubCategories
            .Where(sc => sc.CategoryId == categoryId)
            .OrderBy(sc => sc.Name)
            .ToListAsync();
    }

    public async Task<SubCategory?> GetByIdAsync(int id)
    {
        return await _context.SubCategories.FindAsync(id);
    }

    public async Task<SubCategory> CreateAsync(SubCategory subCategory)
    {
        subCategory.CreatedAt = DateTime.UtcNow;
        _context.SubCategories.Add(subCategory);
        await _context.SaveChangesAsync();
        return subCategory;
    }

    public async Task<SubCategory> UpdateAsync(SubCategory subCategory)
    {
        _context.SubCategories.Update(subCategory);
        await _context.SaveChangesAsync();
        return subCategory;
    }

    public async Task DeleteAsync(int id)
    {
        var sub = await _context.SubCategories.FindAsync(id);
        if (sub != null)
        {
            _context.SubCategories.Remove(sub);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> HasProductsAsync(int id)
    {
        return await _context.Products.AnyAsync(p => p.SubCategoryId == id);
    }
}
