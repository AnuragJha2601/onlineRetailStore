using AutoMapper;
using DhanakTrinket.Core.DTOs;
using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _repository;
    private readonly IMapper _mapper;

    public CategoriesController(ICategoryRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    /// <summary>Get all categories. Public — no auth required.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetAll()
    {
        var categories = await _repository.GetAllAsync();
        var dtos = _mapper.Map<List<CategoryDto>>(categories.ToList());
        return Ok(ApiResponse<List<CategoryDto>>.SuccessResponse(dtos));
    }

    /// <summary>Create a new category (Admin only). Returns existing if duplicate name.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Create([FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(ApiResponse<CategoryDto>.ErrorResponse("Category name is required"));

        // Check for existing duplicate
        var all = await _repository.GetAllAsync();
        var existing = all.FirstOrDefault(c => c.Name.Equals(dto.Name.Trim(), StringComparison.OrdinalIgnoreCase));

        if (existing != null)
        {
            var existingDto = _mapper.Map<CategoryDto>(existing);
            return Ok(ApiResponse<CategoryDto>.SuccessResponse(existingDto, "Category already exists"));
        }

        var category = _mapper.Map<Category>(dto);
        category.Name = dto.Name.Trim();
        var created = await _repository.CreateAsync(category);
        var createdDto = _mapper.Map<CategoryDto>(created);
        return CreatedAtAction(nameof(GetAll), null,
            ApiResponse<CategoryDto>.SuccessResponse(createdDto, "Category created"));
    }

    /// <summary>Rename a category (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Update(int id, [FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(ApiResponse<CategoryDto>.ErrorResponse("Category name is required"));

        var category = await _repository.GetByIdAsync(id);
        if (category == null)
            return NotFound(ApiResponse<CategoryDto>.ErrorResponse("Category not found"));

        category.Name = dto.Name.Trim();
        var updated = await _repository.UpdateAsync(category);
        var updatedDto = _mapper.Map<CategoryDto>(updated);
        return Ok(ApiResponse<CategoryDto>.SuccessResponse(updatedDto, "Category updated"));
    }

    /// <summary>Delete a category (Admin only). Fails if products are assigned.</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Category not found"));

        if (await _repository.HasProductsAsync(id))
            return BadRequest(ApiResponse<object>.ErrorResponse("Cannot delete category that has products assigned. Reassign products first."));

        await _repository.DeleteAsync(id);
        return Ok(ApiResponse<object>.SuccessResponse(null, "Category deleted"));
    }
}
