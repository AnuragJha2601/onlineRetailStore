using DhanakTrinket.Core.DTOs;
using DhanakTrinket.Core.Entities;
using DhanakTrinket.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly DhanakTrinketDbContext _context;

    public SettingsController(DhanakTrinketDbContext context)
    {
        _context = context;
    }

    /// <summary>Get maintenance mode status. Public.</summary>
    [HttpGet("maintenance")]
    public async Task<ActionResult<ApiResponse<bool>>> GetMaintenanceMode()
    {
        var setting = await _context.SiteSettings
            .FirstOrDefaultAsync(s => s.Key == "MaintenanceMode");

        var isEnabled = setting?.Value == "true";
        return Ok(ApiResponse<bool>.SuccessResponse(isEnabled));
    }

    /// <summary>Toggle maintenance mode. Admin only.</summary>
    [Authorize]
    [HttpPut("maintenance")]
    public async Task<ActionResult<ApiResponse<bool>>> SetMaintenanceMode([FromBody] MaintenanceModeRequest request)
    {
        var setting = await _context.SiteSettings
            .FirstOrDefaultAsync(s => s.Key == "MaintenanceMode");

        if (setting == null)
        {
            setting = new SiteSetting
            {
                Key = "MaintenanceMode",
                Value = request.Enabled ? "true" : "false",
                UpdatedAt = DateTime.UtcNow
            };
            _context.SiteSettings.Add(setting);
        }
        else
        {
            setting.Value = request.Enabled ? "true" : "false";
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.SuccessResponse(request.Enabled));
    }
}

public class MaintenanceModeRequest
{
    public bool Enabled { get; set; }
}
