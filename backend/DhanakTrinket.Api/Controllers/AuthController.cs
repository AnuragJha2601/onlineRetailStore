using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DhanakTrinket.Core.DTOs;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(ApiResponse<LoginResponse>.ErrorResponse("Username and password are required"));

        var adminUsername = _configuration["AdminAuth:Username"];
        var adminPasswordHash = _configuration["AdminAuth:PasswordHash"];
        var jwtSecret = _configuration["Jwt:Secret"];

        if (string.IsNullOrEmpty(adminUsername) || string.IsNullOrEmpty(adminPasswordHash) || string.IsNullOrEmpty(jwtSecret))
        {
            _logger.LogError("Admin auth configuration is missing. Set AdminAuth__Username, AdminAuth__PasswordHash, Jwt__Secret env vars.");
            return StatusCode(503, ApiResponse<LoginResponse>.ErrorResponse("Authentication service not configured"));
        }

        // Constant-time username comparison to prevent timing attacks
        var usernameMatch = string.Equals(request.Username.Trim(), adminUsername, StringComparison.Ordinal);
        var passwordMatch = BCrypt.Net.BCrypt.Verify(request.Password, adminPasswordHash);

        if (!usernameMatch || !passwordMatch)
        {
            _logger.LogWarning("Failed login attempt for username: {Username}", request.Username);
            return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse("Invalid username or password"));
        }

        var token = GenerateJwtToken(request.Username, jwtSecret);
        _logger.LogInformation("Admin login successful for username: {Username}", request.Username);

        return Ok(ApiResponse<LoginResponse>.SuccessResponse(new LoginResponse { Token = token }, "Login successful"));
    }

    private static string GenerateJwtToken(string username, string secret)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: "DhanakTrinketApi",
            audience: "DhanakTrinketFrontend",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
