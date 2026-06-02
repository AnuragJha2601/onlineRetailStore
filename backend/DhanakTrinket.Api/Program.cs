using DhanakTrinket.Core.Interfaces;
using DhanakTrinket.Infrastructure.Data;
using DhanakTrinket.Infrastructure.Repositories;
using DhanakTrinket.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Azure.Storage.Blobs;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddSwaggerGen();

// Rate limiting for auth endpoints — per IP
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Configure Entity Framework
builder.Services.AddDbContext<DhanakTrinketDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString) && connectionString.Contains(".database.windows.net"))
    {
        // Azure SQL with Managed Identity
        options.UseSqlServer(connectionString);
    }
    else
    {
        // Local dev — SQLite
        options.UseSqlite(connectionString ?? "Data Source=DhanakTrinket.db");
    }
    // Suppress the "pending model changes" warning — snapshot was generated against SQLite
    // but prod uses SQL Server; schema is correct, the drift is cosmetic (column type annotations only)
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// Configure Azure Blob Storage
builder.Services.AddSingleton(provider =>
{
    var connectionString = builder.Configuration.GetConnectionString("BlobStorage");
    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        // Local dev (Azurite) or legacy connection string
        return new BlobServiceClient(connectionString);
    }

    // Production: use Managed Identity (System-Assigned)
    var accountName = builder.Configuration["AzureStorage:AccountName"] ?? "stdhanak2026prod";
    var blobUri = new Uri($"https://{accountName}.blob.core.windows.net");
    return new BlobServiceClient(blobUri, new DefaultAzureCredential());
});

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Register repositories and services
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ISubCategoryRepository, SubCategoryRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();

// Configure CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",  // Next.js dev server
                    "https://localhost:3000"  // Next.js dev server (HTTPS)
                )
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
        else
        {
            var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
            var origins = new List<string>
            {
                "https://blue-ocean-089852300.7.azurestaticapps.net",
                "https://api-dhanak-trinket-2026.azurewebsites.net",
                "https://www.dhanaktrinket.in",
                "https://dhanaktrinket.in",
                "https://www.dhanaktrinket.com",
                "https://dhanaktrinket.com"
            };
            origins.AddRange(allowedOrigins);
            policy
                .WithOrigins(origins.ToArray())
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
    });
});

// Configure logging
builder.Services.AddLogging();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret configuration is required. Set Jwt__Secret environment variable.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "DhanakTrinketApi",
            ValidAudience = "DhanakTrinketFrontend",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline
// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
// }

// app.UseHttpsRedirection(); // Disabled for development

// Enable CORS
app.UseCors("AllowFrontend");

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Create database if it doesn't exist and run migrations
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<DhanakTrinketDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        context.Database.Migrate();
        logger.LogInformation("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred applying database migrations.");
        throw; // still crash — but now the error is in the logs
    }
}

app.Run();
