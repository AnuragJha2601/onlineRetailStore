using AutoMapper;
using DhanakTrinket.Core.DTOs;
using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubCategoriesController : ControllerBase
{
    private readonly ISubCategoryRepository _repository;
    private readonly IMapper _mapper;

    public SubCategoriesController(ISubCategoryRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    /// <summary>Get all sub-categories for a given parent category.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SubCategoryDto>>>> GetByCategory([FromQuery] int categoryId)
    {
        var subCategories = await _repository.GetByCategoryAsync(categoryId);
        var dtos = _mapper.Map<List<SubCategoryDto>>(subCategories.ToList());
        return Ok(ApiResponse<List<SubCategoryDto>>.SuccessResponse(dtos));
    }

    /// <summary>Create a new sub-category (Admin only). Returns existing if duplicate name+category.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<SubCategoryDto>>> Create([FromBody] CreateSubCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(ApiResponse<SubCategoryDto>.ErrorResponse("Sub-category name is required"));

        // Check for existing duplicate
        var existing = (await _repository.GetByCategoryAsync(dto.CategoryId))
            .FirstOrDefault(sc => sc.Name.Equals(dto.Name.Trim(), StringComparison.OrdinalIgnoreCase));

        if (existing != null)
        {
            var existingDto = _mapper.Map<SubCategoryDto>(existing);
            return Ok(ApiResponse<SubCategoryDto>.SuccessResponse(existingDto, "Sub-category already exists"));
        }

        var subCategory = _mapper.Map<SubCategory>(dto);
        subCategory.Name = dto.Name.Trim();
        var created = await _repository.CreateAsync(subCategory);
        var createdDto = _mapper.Map<SubCategoryDto>(created);
        return CreatedAtAction(nameof(GetByCategory), new { categoryId = created.CategoryId },
            ApiResponse<SubCategoryDto>.SuccessResponse(createdDto, "Sub-category created"));
    }

    /// <summary>Rename a sub-category (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<SubCategoryDto>>> Update(int id, [FromBody] CreateSubCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(ApiResponse<SubCategoryDto>.ErrorResponse("Sub-category name is required"));

        var sub = await _repository.GetByIdAsync(id);
        if (sub == null)
            return NotFound(ApiResponse<SubCategoryDto>.ErrorResponse("Sub-category not found"));

        sub.Name = dto.Name.Trim();
        var updated = await _repository.UpdateAsync(sub);
        var updatedDto = _mapper.Map<SubCategoryDto>(updated);
        return Ok(ApiResponse<SubCategoryDto>.SuccessResponse(updatedDto, "Sub-category updated"));
    }

    /// <summary>Delete a sub-category (Admin only). Fails if products are assigned.</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var sub = await _repository.GetByIdAsync(id);
        if (sub == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Sub-category not found"));

        if (await _repository.HasProductsAsync(id))
            return BadRequest(ApiResponse<object>.ErrorResponse("Cannot delete sub-category that has products assigned. Reassign products first."));

        await _repository.DeleteAsync(id);
        return Ok(ApiResponse<object>.SuccessResponse(null, "Sub-category deleted"));
    }
}
