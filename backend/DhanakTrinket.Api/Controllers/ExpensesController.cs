using DhanakTrinket.Core.DTOs;
using DhanakTrinket.Core.Entities;
using DhanakTrinket.Core.Interfaces;
using DhanakTrinket.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ExpensesController : ControllerBase
{
    private readonly DhanakTrinketDbContext _db;
    private readonly IBlobStorageService _blob;

    public ExpensesController(DhanakTrinketDbContext db, IBlobStorageService blob)
    {
        _db = db;
        _blob = blob;
    }

    // POST /api/expenses — record a new expense
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        if (request.Amount <= 0)
            return BadRequest(ApiResponse<ExpenseDto>.ErrorResponse("Amount must be greater than zero."));

        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest(ApiResponse<ExpenseDto>.ErrorResponse("Description is required."));

        var expense = new Expense
        {
            ExpenseDate = request.ExpenseDate,
            Description = request.Description.Trim(),
            Amount = request.Amount,
            Category = request.Category,
            VendorName = request.VendorName?.Trim(),
            Notes = request.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<ExpenseDto>.SuccessResponse(MapToDto(expense), "Expense recorded."));
    }

    // POST /api/expenses/{id}/bill — upload a bill image for an existing expense
    [HttpPost("{id}/bill")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> UploadBill(int id, IFormFile file)
    {
        var expense = await _db.Expenses.FindAsync(id);
        if (expense == null)
            return NotFound(ApiResponse<ExpenseDto>.ErrorResponse("Expense not found."));

        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<ExpenseDto>.ErrorResponse("No file provided."));

        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(ApiResponse<ExpenseDto>.ErrorResponse("Only JPG, PNG, WebP, or PDF files are allowed."));

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(ApiResponse<ExpenseDto>.ErrorResponse("File must be under 10 MB."));

        await using var stream = file.OpenReadStream();
        var ext = Path.GetExtension(Path.GetFileName(file.FileName));
        var blobName = $"expenses/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}{ext}";
        var blobPath = await _blob.UploadImageAsync(stream, blobName);

        expense.BillImagePath = blobPath;
        await _db.SaveChangesAsync();

        var dto = MapToDto(expense);
        dto.BillImageUrl = await _blob.GetImageUrlAsync(blobPath);

        return Ok(ApiResponse<ExpenseDto>.SuccessResponse(dto, "Bill uploaded."));
    }

    // GET /api/expenses — list expenses with optional filters
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ExpenseDto>>>> GetExpenses(
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] ExpenseCategory? category)
    {
        var query = _db.Expenses.AsQueryable();

        if (year.HasValue)
            query = query.Where(e => e.ExpenseDate.Year == year.Value);
        if (month.HasValue)
            query = query.Where(e => e.ExpenseDate.Month == month.Value);
        if (category.HasValue)
            query = query.Where(e => e.Category == category.Value);

        var expenses = await query.OrderByDescending(e => e.ExpenseDate).ToListAsync();

        var dtos = new List<ExpenseDto>();
        foreach (var e in expenses)
        {
            var dto = MapToDto(e);
            if (!string.IsNullOrEmpty(e.BillImagePath))
                dto.BillImageUrl = await _blob.GetImageUrlAsync(e.BillImagePath);
            dtos.Add(dto);
        }

        return Ok(ApiResponse<List<ExpenseDto>>.SuccessResponse(dtos));
    }

    // DELETE /api/expenses/{id} — delete an expense
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteExpense(int id)
    {
        var expense = await _db.Expenses.FindAsync(id);
        if (expense == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Expense not found."));

        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Expense deleted."));
    }

    private static ExpenseDto MapToDto(Expense e) => new()
    {
        Id = e.Id,
        ExpenseDate = e.ExpenseDate,
        Description = e.Description,
        Amount = e.Amount,
        Category = e.Category.ToString(),
        VendorName = e.VendorName,
        Notes = e.Notes,
        CreatedAt = e.CreatedAt
    };
}
