using DhanakTrinket.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace DhanakTrinket.Infrastructure.Data;

public class DhanakTrinketDbContext : DbContext
{
    public DhanakTrinketDbContext(DbContextOptions<DhanakTrinketDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Price).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Category).HasConversion<int>();

            // Audit fields
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Soft delete
            entity.HasQueryFilter(e => !e.IsDeleted);

            // Index for performance
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.IsInStock);
            entity.HasIndex(e => e.CreatedAt);
        });

        // ProductImage configuration
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
            entity.Property(e => e.BlobPath).HasMaxLength(500);
            entity.Property(e => e.AltText).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Relationship configuration
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Images)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Index for performance
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.IsPrimary);
        });

        // Seed initial data for development
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Seed some sample products for development
        modelBuilder.Entity<Product>().HasData(
            new Product
            {
                Id = 1,
                Name = "Traditional Gold Bangles Set",
                Description = "Beautiful set of 6 traditional gold-plated bangles perfect for festive occasions",
                Category = ProductCategory.Bangles,
                Price = 899.00m,
                IsInStock = true,
                StockQuantity = 10,
                LikesCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = 2,
                Name = "Elegant Pearl Necklace",
                Description = "Stunning pearl necklace with delicate chain work, perfect for special occasions",
                Category = ProductCategory.Necklaces,
                Price = 1299.00m,
                IsInStock = true,
                StockQuantity = 5,
                LikesCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = 3,
                Name = "Chandbali Earrings",
                Description = "Traditional chandbali earrings with intricate design and comfortable fit",
                Category = ProductCategory.Earrings,
                Price = 599.00m,
                IsInStock = false,
                StockQuantity = 0,
                LikesCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entities = ChangeTracker.Entries()
            .Where(x => x.Entity is Product && (x.State == EntityState.Added || x.State == EntityState.Modified));

        foreach (var entity in entities)
        {
            if (entity.State == EntityState.Added)
            {
                ((Product)entity.Entity).CreatedAt = DateTime.UtcNow;
            }

            ((Product)entity.Entity).UpdatedAt = DateTime.UtcNow;
        }
    }
}