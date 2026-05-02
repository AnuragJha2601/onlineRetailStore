using DhanakTrinket.Core.Interfaces;
using DhanakTrinket.Infrastructure.Data;
using DhanakTrinket.Infrastructure.Repositories;
using DhanakTrinket.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Azure.Storage.Blobs;

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
            var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new string[0];
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
    });
});

// Configure logging
builder.Services.AddLogging();

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

app.UseAuthorization();

app.MapControllers();

// Create database if it doesn't exist and run migrations
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<DhanakTrinketDbContext>();
    if (app.Environment.IsDevelopment())
    {
        context.Database.EnsureCreated();
    }
    else
    {
        // In production, ensure database is created and run any pending migrations
        context.Database.EnsureCreated();
    }
}

app.Run();
