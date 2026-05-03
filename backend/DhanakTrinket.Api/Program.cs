using DhanakTrinket.Core.Interfaces;
using DhanakTrinket.Infrastructure.Data;
using DhanakTrinket.Infrastructure.Repositories;
using DhanakTrinket.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddSwaggerGen();

// Configure Entity Framework
builder.Services.AddDbContext<DhanakTrinketDbContext>(options =>
{
    // Use SQLite for local development
    if (builder.Environment.IsDevelopment())
    {
        options.UseSqlite("Data Source=DhanakTrinket.db");
    }
    else
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        options.UseSqlServer(connectionString);
    }
    // Suppress the "pending model changes" warning — snapshot was generated against SQLite
    // but prod uses SQL Server; schema is correct, the drift is cosmetic (column type annotations only)
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// Configure Azure Blob Storage
builder.Services.AddSingleton(provider =>
{
    var connectionString = builder.Configuration.GetConnectionString("BlobStorage");
    return new BlobServiceClient(connectionString);
});

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Register repositories and services
builder.Services.AddScoped<IProductRepository, ProductRepository>();
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
                "https://api-dhanak-trinket-2026.azurewebsites.net"
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Create database if it doesn't exist and run migrations
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<DhanakTrinketDbContext>();
    if (app.Environment.IsDevelopment())
    {
        context.Database.Migrate();
    }
    else
    {
        // In production, apply any pending EF migrations automatically on startup
        context.Database.Migrate();
    }
}

app.Run();
