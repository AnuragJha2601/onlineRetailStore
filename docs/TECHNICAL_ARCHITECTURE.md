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
- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **Image Optimization**: Next.js Image component
- **State Management**: Zustand (lightweight alternative to Redux)
- **HTTP Client**: Axios with custom interceptors

### Backend
- **Framework**: ASP.NET Core 8.0 Web API
- **Language**: C# 12
- **Authentication**: Azure AD B2C (future implementation)
- **Validation**: FluentValidation
- **Mapping**: AutoMapper
- **Documentation**: Swagger/OpenAPI 3.0

### Database & Storage
- **Primary Database**: Azure SQL Database (structured data)
- **Document Storage**: Azure Cosmos DB (product metadata, reviews)
- **Image Storage**: Azure Blob Storage with CDN
- **Caching**: Azure Redis Cache (future optimization)

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
```

### Database Schema (Azure SQL)
- **Products** table: Core product information
- **ProductImages** table: Image metadata and blob references
- **ProductLikes** table: User interactions (future user system)
- **Categories** table: Product categorization
- **Inventory** table: Stock management

---

## API Design

### RESTful Endpoints
```
GET    /api/products              - Get all products (with filters)
GET    /api/products/{id}         - Get specific product
POST   /api/products/{id}/like    - Increment product likes
GET    /api/categories            - Get all categories
GET    /api/products/featured     - Get featured products
GET    /api/products/search?q=    - Search products
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

### Future Implementation
- **Authentication**: Azure AD B2C integration
- **Authorization**: Role-based access control (Admin, Customer)
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
- .NET 8.0 SDK
- Node.js 18+ and npm/yarn
- Visual Studio 2022 or VS Code
- Azure CLI
- SQL Server Management Studio (optional)

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