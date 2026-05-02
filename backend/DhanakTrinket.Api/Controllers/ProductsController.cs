using AutoMapper;
using DhanakTrinket.Core.DTOs;
using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IBlobStorageService _blobStorageService;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(
        IProductService productService,
        IBlobStorageService blobStorageService,
        IMapper mapper,
        ILogger<ProductsController> logger)
    {
        _productService = productService;
        _blobStorageService = blobStorageService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get all products with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ProductDto>>>> GetProducts(
        [FromQuery] ProductFilterRequest? request = null)
    {
        try
        {
            IEnumerable<Product> products;

            if (request?.Category.HasValue == true)
            {
                products = await _productService.GetProductsByCategoryAsync(request.Category.Value);
            }
            else if (!string.IsNullOrWhiteSpace(request?.SearchTerm))
            {
                products = await _productService.SearchProductsAsync(request.SearchTerm);
            }
            else
            {
                products = await _productService.GetAllProductsAsync();
            }

            // Filter by stock status if requested
            if (request?.InStockOnly == true)
            {
                products = products.Where(p => p.IsInStock);
            }

            var productDtos = _mapper.Map<List<ProductDto>>(products.ToList());
            // Generate fresh SAS URLs for all blob-stored images
            foreach (var dto in productDtos)
                foreach (var img in dto.Images.Where(i => !i.ImageUrl.StartsWith("data:") && !i.ImageUrl.StartsWith("http")))
                    img.ImageUrl = _blobStorageService.GenerateSasUrl(img.ImageUrl);
            return Ok(ApiResponse<List<ProductDto>>.SuccessResponse(productDtos, "Products retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, ApiResponse<List<ProductDto>>.ErrorResponse("An error occurred while retrieving products"));
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
            foreach (var img in productDto.Images.Where(i => !i.ImageUrl.StartsWith("data:") && !i.ImageUrl.StartsWith("http")))
                img.ImageUrl = _blobStorageService.GenerateSasUrl(img.ImageUrl);
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

            // Try blob storage, fall back to base64 data URL
            string imageUrl;
            string blobPath;
            try
            {
                using var stream = image.OpenReadStream();
                blobPath = await _blobStorageService.UploadImageAsync(stream, image.FileName);
                // Store blob path (durable); SAS URL generated fresh on each GET
                imageUrl = blobPath;
            }
            catch (Exception blobEx)
            {
                _logger.LogWarning(blobEx, "Blob storage unavailable, storing image as base64");
                using var ms = new MemoryStream();
                await image.CopyToAsync(ms);
                var base64 = Convert.ToBase64String(ms.ToArray());
                imageUrl = $"data:{image.ContentType};base64,{base64}";
                blobPath = $"base64/{Guid.NewGuid()}";
            }

            // Save image record to database
            var productImage = new ProductImage
            {
                ProductId = id,
                ImageUrl = imageUrl,
                BlobPath = blobPath,
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
    /// Delete a product (Admin only)
    /// </summary>
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
    [HttpGet("category/{category}")]
    public async Task<ActionResult<ApiResponse<List<ProductDto>>>> GetProductsByCategory(ProductCategory category)
    {
        try
        {
            var products = await _productService.GetProductsByCategoryAsync(category);
            var productDtos = _mapper.Map<List<ProductDto>>(products.ToList());

            return Ok(ApiResponse<List<ProductDto>>.SuccessResponse(productDtos, $"Products in {category} category retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products for category {Category}", category);
            return StatusCode(500, ApiResponse<List<ProductDto>>.ErrorResponse("An error occurred while retrieving products"));
        }
    }
}