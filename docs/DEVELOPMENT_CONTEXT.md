# Development Context Document

## Project Overview
**Jewelry Haven** - Online retail store for bangles, necklaces, and imitation jewelry built with .NET Core backend and Next.js frontend.

---

## Quick Context Summary

### Business Context
- **Owners**: Husband-wife team exploring jewelry retail business
- **Product Source**: Wholesale bangles and imitation jewelry samples
- **Current Status**: Starting with catalog viewing website
- **Future Goals**: Full e-commerce with payment integration
- **Target Market**: Online jewelry customers, mobile-first approach

### Technical Decisions Made
- **Frontend**: Next.js 14+ with TypeScript (SEO-friendly, image optimization)
- **Backend**: ASP.NET Core 8.0 Web API (owner is C# expert)
- **Database**: Azure SQL Database + Cosmos DB for flexibility
- **Cloud**: Azure ecosystem (existing subscription available)
- **Deployment**: Azure Static Web Apps (frontend) + Azure App Service (backend)

---

## Current Project Structure

### Repository Organization
```
onlineRetailStore/
├── README.md                     # Public-facing documentation
├── TECHNICAL_ARCHITECTURE.md     # Detailed technical specs
├── DEVELOPMENT_CONTEXT.md        # This file - AI context
├── OPEN_ISSUES.md                # Current challenges/todos
├── frontend/                     # Next.js application (TBD)
├── backend/                      # ASP.NET Core Web API (TBD)  
├── database/                     # SQL scripts and migrations (TBD)
├── docs/                         # Additional documentation (TBD)
└── .github/                      # CI/CD workflows (TBD)
```

---

## Development Priorities

### Phase 1 - MVP (Current Focus)
1. **Product Catalog Display**
   - Grid/list view of jewelry products
   - Category filtering (Bangles, Necklaces, Earrings, etc.)
   - Product detail pages with image gallery
   - Search functionality

2. **Core Features**
   - Product likes counter (no user authentication needed)
   - Stock status indicator (In Stock / Sold Out)
   - Mobile-responsive design
   - Fast image loading with optimization

3. **Admin Features (Simple)**
   - Add/edit products via API
   - Upload product images
   - Update stock status
   - View product statistics

### Phase 2 - E-commerce Features
- Shopping cart and checkout
- User authentication (Azure AD B2C)
- Payment integration (Stripe/Razorpay for Indian market)
- Order management
- Email notifications

---

## Technical Implementation Notes

### Database Design
```sql
-- Core entities for Phase 1
Products (Id, Name, Description, Category, Price, IsInStock, StockQuantity, LikesCount, CreatedAt, UpdatedAt)
ProductImages (Id, ProductId, ImageUrl, BlobPath, IsPrimary, DisplayOrder)
Categories (Id, Name, Description, DisplayOrder)
ProductCategories (ProductId, CategoryId) -- Many-to-many relationship
```

### API Endpoints (Phase 1)
```
GET /api/products?category=&search=&page=&limit=
GET /api/products/{id}
POST /api/products/{id}/like
GET /api/categories
POST /api/admin/products (future)
PUT /api/admin/products/{id} (future)
```

### Frontend Components Structure
```
components/
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx  
│   └── Navigation.tsx
├── product/
│   ├── ProductGrid.tsx
│   ├── ProductCard.tsx
│   ├── ProductDetail.tsx
│   └── ProductImageGallery.tsx
├── ui/
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── LoadingSpinner.tsx
└── filters/
    ├── CategoryFilter.tsx
    └── SearchBox.tsx
```

---

## Development Environment Setup

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- Visual Studio 2022 or VS Code with C# extension
- Azure CLI (for deployment)
- Git for version control

### Azure Resources Required
- Azure App Service (Backend API)
- Azure Static Web Apps (Frontend)
- Azure SQL Database (Product data)
- Azure Blob Storage (Product images)
- Azure Application Insights (Monitoring)

### Environment Variables
```bash
# Backend (.NET)
AZURE_SQL_CONNECTION_STRING="Server=..."
AZURE_BLOB_STORAGE_CONNECTION_STRING="..."
AZURE_APPLICATION_INSIGHTS_KEY="..."

# Frontend (Next.js)
NEXT_PUBLIC_API_BASE_URL="https://api.jewelryhaven.com"
NEXT_PUBLIC_AZURE_CDN_BASE_URL="https://cdn.jewelryhaven.com"
```

---

## Coding Standards & Conventions

### Backend (.NET)
- **Architecture**: Clean Architecture with separate layers
- **Patterns**: Repository pattern, Dependency Injection, MediatR for CQRS
- **Validation**: FluentValidation for request validation
- **Error Handling**: Global exception middleware
- **Logging**: Serilog with structured logging
- **Testing**: xUnit for unit tests, integration tests for APIs

### Frontend (Next.js)
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for client state
- **Forms**: React Hook Form with Zod validation
- **Testing**: Jest + Testing Library
- **Code Style**: ESLint + Prettier

### Database
- **Naming**: PascalCase for tables/columns
- **Migrations**: Entity Framework Core migrations
- **Indexing**: Strategic indexes on search/filter columns
- **Data Seeding**: Sample jewelry data for development

---

## Performance Considerations

### Current Optimizations
- Next.js Image component for automatic image optimization
- Azure CDN for static asset delivery
- Database query optimization with EF Core
- Lazy loading for product images
- Pagination for product listings

### Future Optimizations  
- Redis caching for frequently accessed data
- Search indexing with Azure Cognitive Search
- Image compression and multiple sizes
- Progressive Web App (PWA) features
- Server-side rendering for SEO

---

## Security Implementation

### Current Security Measures
- HTTPS enforcement
- CORS policy configuration  
- SQL injection prevention (parameterized queries)
- Input validation and sanitization
- Azure Key Vault for sensitive configuration

### Future Security Enhancements
- Azure AD B2C for user authentication
- JWT token-based API authentication
- Rate limiting and abuse prevention
- OWASP security best practices
- Regular security audits

---

## Deployment Strategy

### Development Workflow
1. **Feature Branch**: Create feature branch from main
2. **Development**: Code and test locally
3. **Pull Request**: Code review and automated testing
4. **Staging**: Deploy to staging environment
5. **Production**: Deploy to production after approval

### CI/CD Pipeline (GitHub Actions)
```yaml
# Planned workflow
- Build and test backend (.NET)
- Build and test frontend (Next.js)
- Run integration tests
- Deploy to staging
- Manual approval gate
- Deploy to production
- Run smoke tests
```

---

## Known Limitations & Technical Debt

### Current Limitations
- No user authentication system yet
- Limited admin interface (API-only)
- Basic error handling and logging
- No automated testing setup
- Manual deployment process

### Planned Improvements
- Implement comprehensive logging
- Add unit and integration test suites  
- Create admin dashboard UI
- Set up automated CI/CD pipeline
- Add monitoring and alerting

---

## Business Logic Notes

### Product Categories
- **Bangles**: Traditional Indian bangles, modern bracelets
- **Necklaces**: Short chains, long necklaces, chokers, pendants
- **Earrings**: Studs, hoops, danglers, chandbali
- **Sets**: Coordinated jewelry sets (necklace + earrings)
- **Bracelets**: Wrist chains, charm bracelets
- **Rings**: Fashion rings, adjustable rings

### Pricing Strategy
- Competitive pricing for wholesale-sourced items
- Clear pricing display (₹ symbol for Indian market)
- Future: Dynamic pricing, discount system
- Payment integration: Razorpay (Indian payments), Stripe (international)

### Inventory Management
- Real-time stock tracking
- Low stock warnings
- Sold out indicators
- Future: Automatic reorder points

---

## Integration Points

### Current Integrations
- Azure Blob Storage for image management
- Azure Application Insights for telemetry
- GitHub for source control

### Planned Integrations
- Payment gateways (Razorpay/Stripe)  
- Email service (SendGrid/Azure Communication Services)
- SMS notifications for orders
- Social media integration for marketing
- Google Analytics for user behavior

---

## Testing Strategy

### Unit Testing
- Backend: Business logic, services, controllers
- Frontend: Components, utilities, hooks
- Database: Repository patterns, data access

### Integration Testing
- API endpoints with real database
- Frontend-backend integration
- Payment gateway integration (when implemented)

### E2E Testing  
- Critical user journeys (browse, like products)
- Mobile responsiveness
- Performance testing

---

## Monitoring & Analytics

### Application Monitoring
- Azure Application Insights for performance
- Custom business metrics (product views, likes)
- Error tracking and alerting
- User session analytics

### Business Metrics
- Most liked products
- Category preferences  
- Search terms analysis
- Mobile vs desktop usage
- Geographic distribution of users

---

*This document should be referenced by AI assistants to understand the full project context, technical decisions, and development priorities.*

**Last Updated**: May 2, 2026  
**Document Version**: 1.0