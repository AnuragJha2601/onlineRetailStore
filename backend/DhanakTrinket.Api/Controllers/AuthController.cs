using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DhanakTrinket.Core.DTOs;
using Google.Apis.Auth;
using Microsoft.AspNetCore.RateLimiting;

namespace DhanakTrinket.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>Legacy password login — kept as fallback until Google OAuth is verified in production. Remove after.</summary>
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var expectedUsername = _configuration["AdminAuth:Username"];
        var expectedPasswordHash = _configuration["AdminAuth:PasswordHash"];
        var jwtSecret = _configuration["Jwt:Secret"];

        if (string.IsNullOrEmpty(expectedUsername) || string.IsNullOrEmpty(expectedPasswordHash) || string.IsNullOrEmpty(jwtSecret))
        {
            _logger.LogWarning("Legacy login attempted but credentials not configured — use Google login instead.");
            return StatusCode(503, ApiResponse<LoginResponse>.ErrorResponse("Legacy login not configured. Use Google Sign-In."));
        }

        if (request.Username != expectedUsername || !BCrypt.Net.BCrypt.Verify(request.Password, expectedPasswordHash))
        {
            _logger.LogWarning("Failed legacy login attempt for user: {Username}", request.Username);
            return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse("Invalid credentials"));
        }

        var token = GenerateJwtToken(expectedUsername, expectedUsername, jwtSecret);
        _logger.LogInformation("Legacy password login for: {Username}", expectedUsername);

        return Ok(ApiResponse<LoginResponse>.SuccessResponse(new LoginResponse { Token = token }, "Login successful"));
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
            return BadRequest(ApiResponse<LoginResponse>.ErrorResponse("Google ID token is required"));

        var clientId = _configuration["GoogleAuth:ClientId"];
        var jwtSecret = _configuration["Jwt:Secret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(jwtSecret))
        {
            _logger.LogError("Google auth configuration is missing. Set GoogleAuth__ClientId and Jwt__Secret env vars.");
            return StatusCode(503, ApiResponse<LoginResponse>.ErrorResponse("Authentication service not configured"));
        }

        // Get allowed admin emails from config (supports env var arrays: AdminAuth__AllowedEmails__0, __1, etc.)
        var allowedEmails = _configuration.GetSection("AdminAuth:AllowedEmails").Get<string[]>() ?? [];
        if (allowedEmails.Length == 0)
        {
            _logger.LogError("No admin emails configured. Set AdminAuth__AllowedEmails__0, AdminAuth__AllowedEmails__1, etc.");
            return StatusCode(503, ApiResponse<LoginResponse>.ErrorResponse("Authentication service not configured"));
        }

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId]
            });

            var email = payload.Email?.ToLowerInvariant();
            if (string.IsNullOrEmpty(email) || !payload.EmailVerified)
            {
                _logger.LogWarning("Google login with unverified email: {Email}", email);
                return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse("Email not verified"));
            }

            // Check if this email is an allowed admin
            var isAdmin = allowedEmails.Any(e => string.Equals(e, email, StringComparison.OrdinalIgnoreCase));
            if (!isAdmin)
            {
                _logger.LogWarning("Unauthorized Google login attempt from: {Email}", email);
                return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse("Not authorized as admin"));
            }

            var token = GenerateJwtToken(email, payload.Name ?? email, jwtSecret);
            _logger.LogInformation("Admin Google login successful for: {Email}", email);

            return Ok(ApiResponse<LoginResponse>.SuccessResponse(new LoginResponse { Token = token }, "Login successful"));
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning("Invalid Google ID token: {Message}", ex.Message);
            return Unauthorized(ApiResponse<LoginResponse>.ErrorResponse("Invalid Google token"));
        }
    }

    private static string GenerateJwtToken(string email, string name, string secret)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Email, email),
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
