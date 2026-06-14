using AutoMapper;
using DhanakTrinket.Core.DTOs;
using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;
using DhanakTrinket.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IBlobStorageService _blobStorageService;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductsController> _logger;
    private readonly DhanakTrinketDbContext _context;

    public ProductsController(
        IProductService productService,
        IBlobStorageService blobStorageService,
        IMapper mapper,
        ILogger<ProductsController> logger,
        DhanakTrinketDbContext context)
    {
        _productService = productService;
        _blobStorageService = blobStorageService;
        _mapper = mapper;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Get products with server-side filtering, sorting, and pagination — public, returns retail price only.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<ProductDto>>>> GetProducts(
        [FromQuery] ProductFilterRequest? request = null)
    {
        try
        {
            request ??= new ProductFilterRequest();
            var (items, totalCount) = await _productService.GetFilteredProductsAsync(request);

            var productDtos = _mapper.Map<List<ProductDto>>(items);
            var paginated = new PaginatedResponse<ProductDto>
            {
                Items = productDtos,
                TotalCount = totalCount,
                Page = Math.Max(1, request.Page),
                PageSize = Math.Clamp(request.PageSize, 1, 100),
            };
            return Ok(ApiResponse<PaginatedResponse<ProductDto>>.SuccessResponse(paginated, "Products retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, ApiResponse<PaginatedResponse<ProductDto>>.ErrorResponse("An error occurred while retrieving products"));
        }
    }

    /// <summary>
    /// Admin product list — includes cost price, Pari price, wholesale price. Requires auth.
    /// Used by the Inventory tab.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<ActionResult<ApiResponse<List<AdminProductDto>>>> GetAdminProducts(
        [FromQuery] ProductFilterRequest? request = null)
    {
        try
        {
            IEnumerable<Product> products;

            if (!string.IsNullOrWhiteSpace(request?.ProductCode))
            {
                var match = await _productService.GetProductByCodeAsync(request.ProductCode);
                products = match != null ? [match] : [];
            }
            else if (request?.CategoryId.HasValue == true)
            {
                products = await _productService.GetProductsByCategoryAsync(request.CategoryId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(request?.SearchTerm))
            {
                products = await _productService.SearchProductsAsync(request.SearchTerm);
            }
            else
            {
                products = await _productService.GetAllProductsAsync();
            }

            if (request?.InStockOnly == true)
                products = products.Where(p => p.IsInStock);

            var adminDtos = _mapper.Map<List<AdminProductDto>>(products.ToList());
            return Ok(ApiResponse<List<AdminProductDto>>.SuccessResponse(adminDtos, "Products retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving admin products");
            return StatusCode(500, ApiResponse<List<AdminProductDto>>.ErrorResponse("An error occurred while retrieving products"));
        }
    }

    /// <summary>
    /// Get a specific product by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetProduct(int id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
            {
                return NotFound(ApiResponse<ProductDto>.ErrorResponse("Product not found"));
            }

            var productDto = _mapper.Map<ProductDto>(product);
            // Detail view: generate SAS for full image only (lazy, called on modal open)
            foreach (var img in productDto.Images)
                if (!img.ImageUrl.StartsWith("data:") && !img.ImageUrl.StartsWith("http"))
                    img.ImageUrl = _blobStorageService.GenerateSasUrl(img.ImageUrl);
            // ThumbnailUrl is a plain public HTTPS URL — no SAS needed
            return Ok(ApiResponse<ProductDto>.SuccessResponse(productDto, "Product retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product {ProductId}", id);
            return StatusCode(500, ApiResponse<ProductDto>.ErrorResponse("An error occurred while retrieving the product"));
        }
    }

    /// <summary>
    /// Create a new product (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductDto>>> CreateProduct([FromBody] CreateProductDto createProductDto)
    {
        try
        {
            var product = _mapper.Map<Product>(createProductDto);
            var createdProduct = await _productService.CreateProductAsync(product);
            var productDto = _mapper.Map<ProductDto>(createdProduct);

            return CreatedAtAction(
                nameof(GetProduct),
                new { id = createdProduct.Id },
                ApiResponse<ProductDto>.SuccessResponse(productDto, "Product created successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<ProductDto>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, ApiResponse<ProductDto>.ErrorResponse("An error occurred while creating the product"));
        }
    }

    /// <summary>
    /// Upload product image (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/images")]
    public async Task<ActionResult<ApiResponse<ProductImageDto>>> UploadProductImage(int id, IFormFile image)
    {
        try
        {
            // Validate product exists
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
            {
                return NotFound(ApiResponse<ProductImageDto>.ErrorResponse("Product not found"));
            }

            // Validate image file
            if (image == null || image.Length == 0)
            {
                return BadRequest(ApiResponse<ProductImageDto>.ErrorResponse("No image file provided"));
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(image.ContentType.ToLowerInvariant()))
            {
                return BadRequest(ApiResponse<ProductImageDto>.ErrorResponse("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed"));
            }

            // Validate file size (5MB max)
            if (image.Length > 5 * 1024 * 1024)
            {
                return BadRequest(ApiResponse<ProductImageDto>.ErrorResponse("File size too large. Maximum size is 5MB"));
            }

            // Read image bytes once — needed for both full upload and thumbnail generation
            using var imageMemory = new MemoryStream();
            await image.CopyToAsync(imageMemory);
            imageMemory.Position = 0;

            // Upload full-size image to blob storage
            string imageUrl;
            string blobPath;
            try
            {
                blobPath = await _blobStorageService.UploadImageAsync(imageMemory, image.FileName);
                imageUrl = blobPath;
            }
            catch (Exception blobEx)
            {
                _logger.LogWarning(blobEx, "Blob storage unavailable, storing image as base64");
                imageMemory.Position = 0;
                var base64 = Convert.ToBase64String(imageMemory.ToArray());
                imageUrl = $"data:{image.ContentType};base64,{base64}";
                blobPath = $"base64/{Guid.NewGuid()}";
            }

            // Generate and upload thumbnail to PUBLIC container (800×800 WebP, quality 85)
            // Higher res for retina screens; WebP = smaller file than old 300px JPEG
            string? thumbnailUrl = null;
            try
            {
                imageMemory.Position = 0;
                using var thumbImage = await SixLabors.ImageSharp.Image.LoadAsync(imageMemory);
                thumbImage.Mutate(x => x.Resize(new ResizeOptions
                {
                    Size = new SixLabors.ImageSharp.Size(800, 800),
                    Mode = ResizeMode.Max
                }));
                using var thumbStream = new MemoryStream();
                await thumbImage.SaveAsWebpAsync(thumbStream, new WebpEncoder { Quality = 85 });
                thumbStream.Position = 0;
                var thumbFileName = "thumb_" + Path.GetFileNameWithoutExtension(image.FileName) + ".webp";
                thumbnailUrl = await _blobStorageService.UploadThumbnailPublicAsync(thumbStream, thumbFileName);
            }
            catch (Exception thumbEx)
            {
                _logger.LogWarning(thumbEx, "Thumbnail generation failed for product {ProductId}", id);
            }

            // Save image record to database
            var productImage = new ProductImage
            {
                ProductId = id,
                ImageUrl = imageUrl,
                BlobPath = blobPath,
                ThumbnailUrl = thumbnailUrl,
                AltText = $"{product.Name} image",
                IsPrimary = !product.Images.Any(),
                DisplayOrder = product.Images.Count,
                CreatedAt = DateTime.UtcNow
            };

            await _productService.AddProductImageAsync(productImage);

            var imageDto = _mapper.Map<ProductImageDto>(productImage);

            return Ok(ApiResponse<ProductImageDto>.SuccessResponse(imageDto, "Image uploaded successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for product {ProductId}", id);
            return StatusCode(500, ApiResponse<ProductImageDto>.ErrorResponse("An error occurred while uploading the image"));
        }
    }

    /// <summary>
    /// Update a product (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> UpdateProduct(int id, [FromBody] UpdateProductDto updateProductDto)
    {
        try
        {
            var product = _mapper.Map<Product>(updateProductDto);
            product.Id = id;

            var updatedProduct = await _productService.UpdateProductAsync(product);
            var productDto = _mapper.Map<ProductDto>(updatedProduct);

            return Ok(ApiResponse<ProductDto>.SuccessResponse(productDto, "Product updated successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<ProductDto>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, ApiResponse<ProductDto>.ErrorResponse("An error occurred while updating the product"));
        }
    }

    /// <summary>
    /// Delete an image from a product (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{productId}/images/{imageId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProductImage(int productId, int imageId)
    {
        try
        {
            var image = await _context.ProductImages
                .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId);

            if (image == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Image not found"));

            // Delete blobs
            if (!string.IsNullOrEmpty(image.BlobPath))
            {
                try { await _blobStorageService.DeleteImageAsync(image.BlobPath); } catch { /* best-effort */ }
            }
            if (!string.IsNullOrEmpty(image.ThumbnailUrl))
            {
                // Extract blob name from thumbnail URL for deletion
                var thumbUri = new Uri(image.ThumbnailUrl);
                var thumbPath = thumbUri.AbsolutePath.TrimStart('/');
                // Remove container name prefix
                var containerPrefix = "product-thumbnails/";
                if (thumbPath.StartsWith(containerPrefix))
                    thumbPath = thumbPath[containerPrefix.Length..];
                try { await _blobStorageService.DeleteImageAsync(thumbPath); } catch { /* best-effort */ }
            }

            _context.ProductImages.Remove(image);

            // If deleted image was primary, promote the next one
            if (image.IsPrimary)
            {
                var nextImage = await _context.ProductImages
                    .Where(i => i.ProductId == productId && i.Id != imageId)
                    .OrderBy(i => i.DisplayOrder)
                    .FirstOrDefaultAsync();
                if (nextImage != null)
                    nextImage.IsPrimary = true;
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null, "Image deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image {ImageId} for product {ProductId}", imageId, productId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred while deleting the image"));
        }
    }

    /// <summary>
    /// Set an image as primary (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{productId}/images/{imageId}/primary")]
    public async Task<ActionResult<ApiResponse<object>>> SetPrimaryImage(int productId, int imageId)
    {
        try
        {
            var images = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .ToListAsync();

            var target = images.FirstOrDefault(i => i.Id == imageId);
            if (target == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Image not found"));

            foreach (var img in images)
                img.IsPrimary = img.Id == imageId;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null, "Primary image updated"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting primary image {ImageId} for product {ProductId}", imageId, productId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred"));
        }
    }

    /// <summary>
    /// Delete a product (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProduct(int id)
    {
        try
        {
            await _productService.DeleteProductAsync(id);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Product deleted successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred while deleting the product"));
        }
    }

    /// <summary>
    /// Like a product (Customer feature)
    /// </summary>
    [HttpPost("{id}/like")]
    public async Task<ActionResult<ApiResponse<object>>> LikeProduct(int id)
    {
        try
        {
            await _productService.LikeProductAsync(id);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Product liked successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking product {ProductId}", id);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred while liking the product"));
        }
    }

    /// <summary>
    /// Get products by category
    /// </summary>
    [HttpGet("category/{categoryId:int}")]
    public async Task<ActionResult<ApiResponse<List<ProductDto>>>> GetProductsByCategory(int categoryId)
    {
        try
        {
            var products = await _productService.GetProductsByCategoryAsync(categoryId);
            var productDtos = _mapper.Map<List<ProductDto>>(products.ToList());

            return Ok(ApiResponse<List<ProductDto>>.SuccessResponse(productDtos, $"Products in category {categoryId} retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products for category {CategoryId}", categoryId);
            return StatusCode(500, ApiResponse<List<ProductDto>>.ErrorResponse("An error occurred while retrieving products"));
        }
    }
}