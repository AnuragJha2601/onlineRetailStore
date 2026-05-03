# Technical Architecture Document

## Online Jewelry Retail Store - Technical Architecture

### Project Overview
A modern, scalable e-commerce platform specializing in jewelry and imitation accessories with support for catalog browsing, product likes, inventory management, and future payment integration.

---

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   (Next.js)     │◄──►│  (ASP.NET Core)  │◄──►│  (Azure SQL/    │
│                 │    │     Web API      │    │   Cosmos DB)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Azure Static   │    │   Azure App      │    │   Azure Blob    │
│   Web Apps      │    │    Service       │    │    Storage      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with TypeScript (static export)
- **Styling**: Tailwind CSS
- **Image Optimization**: Next.js Image component
- **State Management**: React `useState` / `useContext` (no external state library)
- **HTTP Client**: Native `fetch` wrapped in `apiRequest` helper

### Backend
- **Framework**: ASP.NET Core 9.0 Web API
- **Language**: C# 13
- **Authentication**: JWT Bearer tokens, BCrypt.Net-Next password hashing
- **Validation**: FluentValidation
- **Mapping**: AutoMapper
- **ORM**: Entity Framework Core 9 (code-first, SQLite for dev / Azure SQL for prod)

### Database & Storage
- **Primary Database**: Azure SQL Database (Azure SQL `db-dhanak-trinket`)
- **Image Storage**: Azure Blob Storage (`stdhanak2026prod`, `product-images` container)
- **Bill Storage**: Azure Blob Storage (`expenses/YYYY/MM/DD/` prefix)
- **Caching**: None currently (future: Azure Redis Cache)

### Infrastructure & DevOps
- **Hosting**: 
  - Frontend: Azure Static Web Apps
  - Backend: Azure App Service
- **CI/CD**: GitHub Actions
- **Monitoring**: Azure Application Insights
- **Security**: Azure Key Vault for secrets management

---

## Data Architecture

### Core Entities
```csharp
// Product Entity
public class JewelryProduct
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public ProductCategory Category { get; set; } // Bangles, Necklaces, Earrings
    public decimal Price { get; set; }
    public bool IsInStock { get; set; }
    public int StockQuantity { get; set; }
    public int LikesCount { get; set; }
    public List<ProductImage> Images { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Product Categories
public enum ProductCategory
{
    Bangles,
    Necklaces,
    Earrings,
    Bracelets,
    Rings,
    Sets
}

// Sale entity
public class Sale
{
    public int Id { get; set; }
    public int? ProductId { get; set; }     // null for custom/wholesale items
    public string ProductName { get; set; }
    public SaleType SaleType { get; set; }  // Retail | Wholesale
    public int QuantitySold { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime SaleDate { get; set; }
    public string? CustomerName { get; set; }
    public string? SaleChannel { get; set; }
    public string? Notes { get; set; }
    public int? WholesaleDealId { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Expense entity
public class Expense
{
    public int Id { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string Description { get; set; }
    public decimal Amount { get; set; }
    public ExpenseCategory Category { get; set; }  // InventoryPurchase | Packaging | Shipping | Marketing | Other
    public string? VendorName { get; set; }
    public string? BillImagePath { get; set; }     // Azure Blob path
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Database Schema (Azure SQL)
- **Products** table: Core product information
- **ProductImages** table: Image metadata and blob references
- **Sales** table: Retail and wholesale sale records
- **WholesaleDeals** table: Bulk deal grouping with buyer info
- **Expenses** table: Business expense records with optional bill image

---

## API Design

### RESTful Endpoints
```
# Products (public)
GET    /api/products                       - Get products (filters: category, inStockOnly, search, page)
GET    /api/products/{id}                  - Get specific product with images
POST   /api/products/{id}/like             - Increment product likes

# Products (admin)
POST   /api/products                       - Create product
POST   /api/products/{id}/images           - Upload product image to Blob Storage
PATCH  /api/products/{id}/stock            - Update stock quantity / in-stock flag

# Admin auth
POST   /api/auth/login                     - Authenticate and receive JWT (8-hour expiry)

# Sales (admin)
POST   /api/sales                          - Record a sale (decrements stock if ProductId given)
GET    /api/sales?year=&month=&saleType=   - List sales with optional filters
GET    /api/sales/summary?year=            - Monthly revenue summary grouped by month
DELETE /api/sales/{id}                     - Delete sale and restore stock

# Expenses (admin)
POST   /api/expenses                       - Create expense record
POST   /api/expenses/{id}/bill             - Upload bill image (multipart)
GET    /api/expenses?year=&month=&category= - List expenses with optional filters
DELETE /api/expenses/{id}                  - Delete expense record
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "errors": [],
  "metadata": {
    "page": 1,
    "totalCount": 150,
    "hasNextPage": true
  }
}
```

---

## Security Considerations

### Current Implementation
- **HTTPS Only**: All communication encrypted
- **CORS Policy**: Restricted to frontend domain
- **Input Validation**: Server-side validation on all endpoints
- **SQL Injection Prevention**: Entity Framework parameterized queries

### Current Auth Implementation
- **JWT Bearer**: Single `dhanakadmin` user, credentials stored in Azure App Service env vars
- **BCrypt hashing**: `BCrypt.Net-Next` for password hash comparison
- **Token storage**: Frontend stores JWT in `localStorage` key `dhanak_admin_token` (8-hour expiry)
- **Route protection**: All admin endpoints use `[Authorize(Roles = "Admin")]`

### Future Implementation
- **Rate Limiting**: API throttling for abuse prevention
- **Data Protection**: GDPR compliance for customer data

---

## Performance & Scalability

### Current Optimizations
- **Image Optimization**: Next.js automatic image optimization
- **Database Indexing**: Optimized queries for product search
- **Caching**: Browser caching for static assets
- **CDN**: Azure CDN for global content delivery

### Future Scalability
- **Horizontal Scaling**: Azure App Service scaling rules
- **Database Scaling**: Read replicas for query optimization
- **Caching Layer**: Redis for frequently accessed data
- **Search**: Azure Cognitive Search for advanced product search

---

## Development Environment

### Prerequisites
- .NET 9.0 SDK
- Node.js 20+ and npm
- Visual Studio 2022 or VS Code
- Azure CLI
- SQL Server Management Studio or Azure Data Studio (optional)

### Local Development Setup
1. Clone repository
2. Set up backend: `dotnet restore && dotnet run`
3. Set up frontend: `npm install && npm run dev`
4. Configure Azure resources (see DEVELOPMENT_CONTEXT.md)

---

## Deployment Strategy

### Staging Environment
- **Frontend**: Azure Static Web Apps (staging slot)
- **Backend**: Azure App Service (staging slot)
- **Database**: Separate staging database

### Production Environment
- **Blue-Green Deployment**: Zero-downtime deployments
- **Database Migration**: Entity Framework migrations
- **Rollback Strategy**: GitHub Actions rollback workflows

---

## Monitoring & Analytics

### Application Monitoring
- **Performance**: Azure Application Insights
- **Error Tracking**: Custom error logging with Serilog
- **User Analytics**: Google Analytics integration (frontend)
- **Business Metrics**: Product views, likes, conversion rates

### Health Checks
- **API Health**: `/health` endpoint
- **Database Connectivity**: Entity Framework health checks
- **External Dependencies**: Blob storage connectivity

---

## Future Enhancements

### Phase 2 - E-commerce Features
- Shopping cart functionality
- User authentication and profiles
- Order management system
- Payment integration (Stripe, PayPal, Razorpay)
- Email notifications

### Phase 3 - Advanced Features  
- Product reviews and ratings
- Wishlist functionality
- Advanced search and filtering
- Inventory management dashboard
- Mobile app (React Native/Flutter)

### Phase 4 - Analytics & AI
- Recommendation engine
- Price optimization
- Inventory forecasting
- Customer behavior analytics
- Chatbot integration

---

*Document Version: 1.0*  
*Last Updated: May 2, 2026*  
*Author: Development Team*