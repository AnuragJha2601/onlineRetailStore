# Open Issues & Challenges

## Current Status
**Project Phase**: Live in Production  
**Last Updated**: May 3, 2026

---

## ✅ Completed

### Infrastructure
- [x] Azure App Service (`api-dhanak-trinket-2026`)
- [x] Azure Static Web Apps (customer catalog + admin)
- [x] Azure SQL Database (`db-dhanak-trinket`)
- [x] Azure Blob Storage (`stdhanak2026prod`, `product-images` container)

### Backend
- [x] ASP.NET Core 9.0 Web API — Clean Architecture (Core/Infrastructure/Api)
- [x] EF Core with Azure SQL (Managed Identity auth)
- [x] Full CRUD for products + image upload
- [x] CORS configured for `*.azurestaticapps.net`
- [x] Image upload: private blob container, SAS URLs generated on read
- [x] Standardized `ApiResponse<T>` wrapper

### Frontend
- [x] Next.js static export deployed to Azure Static Web Apps
- [x] Customer catalog with search and category filter
- [x] Admin panel — add products + upload images
- [x] Production API URL baked in via GitHub Actions env var
- [x] SPA routing via `staticwebapp.config.json`

### Auth (completed in previous session)
- [x] JWT Bearer auth — single admin via env vars (`ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`)
- [x] BCrypt.Net-Next password hashing
- [x] Login page at `/login` → stores JWT in localStorage
- [x] `AuthContext` + `useAuth` hook
- [x] Admin page protected — redirects to `/login` when not authenticated

### Sales Tracking (completed May 3, 2026)
- [x] `Sale` + `WholesaleDeal` entities in `DhanakTrinket.Core/Entities/Sale.cs`
- [x] `SaleType` enum: `Retail = 1`, `Wholesale = 2`
- [x] `SalesController` with endpoints:
  - `POST /api/sales` — record sale, decrement stock, auto-mark OOS at 0 (Admin)
  - `GET /api/sales?year=&month=&saleType=` — list with filters (Admin)
  - `GET /api/sales/summary?year=` — monthly P&L summary grouped by month (Admin)
  - `DELETE /api/sales/{id}` — undo a sale, restores stock (Admin)
- [x] DTOs: `RecordSaleRequest`, `SaleDto`, `SalesSummaryDto`
- [x] Frontend TypeScript types in `src/types/product.ts`
- [x] `productApi.recordSale()`, `getSales()`, `getSalesSummary()` added
- [x] `MarkAsSoldModal` component — Retail/Wholesale toggle, date, qty, price, channel, optional customer/buyer details
- [x] Admin inventory table — shows all products with "Mark as Sold" button per row

---

## 🚧 Open / Pending

### Deployment Required (Sales Tracking is complete locally — needs deployment)
- [ ] **EF Migration** — create + apply migration for `Sales` and `WholesaleDeals` tables to Azure SQL
  - Dev: `dotnet ef migrations add AddSalesTables` → `dotnet ef database update`
  - Prod: push migration bundle or run against Azure SQL via App Service
- [ ] **Deploy backend** with new SalesController
- [ ] **Deploy frontend** with updated admin page + modal (either `git push` → GitHub Actions, or manual zip deploy)

### Immediate
- [ ] Move blob connection string from `appsettings.Production.json` to Azure App Service environment variables
- [ ] Remove base64 fallback in `UploadProductImage` — blob storage works, fallback is no longer needed
- [ ] Re-seed products with real photos (current seed data has no images)

### Features Missing
- [ ] Edit/delete products in admin panel
- [ ] Product detail page (clicking a catalog item does nothing)
- [ ] Like functionality wired up end-to-end (field exists, no UI)
- [ ] **Expenses tracking** — `Expense` entity: date, amount, category (Inventory/Packaging/Shipping/Other), vendor, notes; admin form + list view
- [ ] **P&L dashboard** (`/admin/dashboard`) — Revenue − Expenses by month, month-over-month view

### CI/CD
- [ ] GitHub Actions workflow for backend deploy (currently manual `az webapp deploy`)

---

## 📅 Phase 2 — Planned Features

### Expenses & P&L Console (next up)
Business operations features to track full profit picture:
- `Expense` entity: `Date`, `Amount`, `Category` (enum), `VendorName`, `Description`, `CreatedAt`
- `ExpensesController` (Admin-only CRUD)
- Admin expenses form — quick-add purchase/packaging/shipping costs
- P&L dashboard: `Revenue = SUM(Sales.TotalAmount)`, `Cost = SUM(Expenses.Amount)`, `Profit = Revenue − Cost` per month

### Dual Pricing (Cost Price + Selling Price)
- [ ] **Backend** — add `CostPrice` (decimal, admin-only) and `SellingPrice` (decimal, public) fields to `Product` entity + EF migration
- [ ] **Selling price default** — auto-calculate as `CostPrice × 1.35` (35% markup) but overridable by admin
- [ ] **Admin form** — show both fields; `SellingPrice` pre-fills at +35% when `CostPrice` is entered, editable
- [ ] **Customer catalog** — show `SellingPrice` only; `CostPrice` never exposed in public API responses (`ProductDto`)

### E-commerce
- [ ] Shopping cart and checkout
- [ ] Payment gateway (Razorpay/Stripe)
- [ ] Order management
- [ ] Email notifications (order confirmation, dispatch)

## 🔄 Medium Priority Items

### Development Environment
- [ ] Set up local development environment guide
- [ ] Configure debugging for both frontend and backend
- [ ] Create sample data seeding scripts
- [ ] Set up code formatting and linting rules

---

## ✅ Completed

### Infrastructure
- [x] Azure App Service (`api-dhanak-trinket-2026`)
- [x] Azure Static Web Apps (customer catalog + admin)
- [x] Azure SQL Database (`db-dhanak-trinket`)
- [x] Azure Blob Storage (`stdhanak2026prod`, `product-images` container)

### Backend
- [x] ASP.NET Core 9.0 Web API — Clean Architecture (Core/Infrastructure/Api)
- [x] EF Core with Azure SQL (Managed Identity auth)
- [x] Full CRUD for products + image upload
- [x] CORS configured for `*.azurestaticapps.net`
- [x] Image upload: private blob container, SAS URLs generated on read
- [x] Standardized `ApiResponse<T>` wrapper

### Frontend
- [x] Next.js static export deployed to Azure Static Web Apps
- [x] Customer catalog with search and category filter
- [x] Admin panel — add products + upload images
- [x] Production API URL baked in via GitHub Actions env var
- [x] SPA routing via `staticwebapp.config.json`

---

## 🚧 Open / Pending

### Immediate
- [ ] Move blob connection string from `appsettings.Production.json` to Azure App Service environment variables
- [ ] Remove base64 fallback in `UploadProductImage` — blob storage works, fallback is no longer needed
- [ ] Re-seed products with real photos (current seed data has no images)

### Features Missing
- [ ] Edit/delete products in admin panel
- [ ] Product detail page (clicking a catalog item does nothing)
- [ ] Like functionality wired up end-to-end (field exists, no UI)
- [ ] Stock quantity management in admin

### CI/CD
- [ ] GitHub Actions workflow for backend deploy (currently manual `az webapp deploy`)

---

## 📅 Phase 2 — Planned Features

### Authentication & Role-Based Access
- [ ] **Admin login page** — simple login (username/password or Azure AD) that checks user role
- [ ] **Role-based nav** — "Admin" tab only visible when logged in as admin; catalog-only view for unauthenticated users
- [ ] **Route protection** — `/admin` redirects to login if not authenticated; catalog remains fully public
- [ ] **Backend** — JWT or session auth, `[Authorize(Roles = "Admin")]` on all admin endpoints
- [ ] **Considerations**: Keep it simple initially (single admin user, hashed password in DB or env var) before full Azure AD B2C

### Dual Pricing (Cost Price + Selling Price)
- [ ] **Backend** — add `CostPrice` (decimal, admin-only) and `SellingPrice` (decimal, public) fields to `Product` entity + EF migration
- [ ] **Selling price default** — auto-calculate as `CostPrice × 1.35` (35% markup) but overridable by admin
- [ ] **Admin form** — show both fields; `SellingPrice` pre-fills at +35% when `CostPrice` is entered, editable
- [ ] **Customer catalog** — show `SellingPrice` only; `CostPrice` never exposed in public API responses (`ProductDto`)
- [ ] **Admin DTO** — separate `AdminProductDto` that includes `CostPrice` for internal use

### E-commerce
- [ ] Shopping cart and checkout
- [ ] Payment gateway (Razorpay/Stripe)
- [ ] Order management
- [ ] Email notifications (order confirmation, dispatch)

## 🔄 Medium Priority Items

### Development Environment
- [ ] Set up local development environment guide
- [ ] Configure debugging for both frontend and backend
- [ ] Create sample data seeding scripts
- [ ] Set up code formatting and linting rules

### Features - Phase 1
- [ ] Product likes functionality (without user auth)
- [ ] Stock status display (In Stock/Sold Out)
- [ ] Basic product search
- [ ] Category-based filtering
- [ ] Mobile-responsive design implementation

### Testing
- [ ] Set up unit testing framework for backend
- [ ] Configure testing for frontend components
- [ ] Create integration tests for API endpoints
- [ ] Set up automated testing in CI/CD pipeline

---

## 📅 Future Considerations

### Phase 2 Features (E-commerce)
- [ ] User authentication system (Azure AD B2C)
- [ ] Shopping cart functionality
- [ ] Checkout process design
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Order management system
- [ ] Email notification system

### Performance & Optimization
- [ ] Implement caching strategies (Redis)
- [ ] Set up Azure CDN for images
- [ ] Optimize database queries and indexing
- [ ] Add Progressive Web App (PWA) features
- [ ] Image compression and multiple sizes

### Admin Features
- [ ] Admin dashboard for product management
- [ ] Bulk product upload functionality
- [ ] Inventory management interface
- [ ] Sales analytics and reporting
- [ ] Customer management system

---

## ❗ Technical Challenges

### Image Management
- **Challenge**: Handling high-quality jewelry images efficiently
- **Considerations**: 
  - Multiple image sizes for different screen resolutions
  - Image compression without quality loss
  - Fast loading and smooth user experience
  - Storage costs optimization

### Mobile Experience
- **Challenge**: Ensuring excellent mobile shopping experience
- **Considerations**:
  - Touch-friendly product galleries
  - Fast loading on slower connections
  - Intuitive navigation for small screens
  - Mobile payment integration

### SEO Optimization
- **Challenge**: Making products discoverable via search engines
- **Considerations**:
  - Server-side rendering with Next.js
  - Structured data for product pages
  - Meta tags optimization
  - Sitemap generation
  - Page load speed optimization

### Scalability Planning
- **Challenge**: Architecture that can handle business growth
- **Considerations**:
  - Database scaling strategies
  - API rate limiting and caching
  - CDN setup for global reach
  - Monitoring and alerting systems

---

## 🐛 Known Issues

*No known issues at this time - project is in initial setup phase*

---

## 💡 Ideas & Enhancements

### User Experience
- [ ] Product comparison feature
- [ ] Wishlist functionality
- [ ] Recently viewed products
- [ ] Product recommendations based on likes
- [ ] Social sharing integration

### Business Features
- [ ] Discount and coupon system
- [ ] Bulk order pricing
- [ ] Customer reviews and ratings
- [ ] Inventory alerts for low stock
- [ ] Seasonal collection organization

### Technical Improvements
- [ ] GraphQL API consideration for flexible queries
- [ ] Real-time notifications for stock updates
- [ ] Advanced search with filters (price, material, color)
- [ ] Multi-language support
- [ ] Currency conversion for international customers

---

## 📊 Metrics & Success Criteria

### Phase 1 Success Metrics
- [ ] Website loads in under 2 seconds
- [ ] Mobile-responsive design passes Google Mobile-Friendly test
- [ ] All products displayable with high-quality images
- [ ] Search functionality returns relevant results
- [ ] Category filtering works seamlessly

### Business Goals
- [ ] Achieve 100+ product listings
- [ ] Enable product liking functionality
- [ ] Mobile traffic > 70% of total traffic
- [ ] Page load speed score > 90 (Google PageSpeed)
- [ ] Zero critical security vulnerabilities

---

## 🔧 Development Workflow

### Current Workflow Status
- [ ] Git repository initialized and connected to GitHub
- [ ] Development branch strategy defined
- [ ] Code review process established
- [ ] CI/CD pipeline configured
- [ ] Deployment process documented

### Documentation Updates Needed
- [ ] API documentation (when backend is ready)
- [ ] Component library documentation
- [ ] Deployment guide for new developers
- [ ] User manual for admin features
- [ ] Troubleshooting guide

---

## 📝 Notes

### Design Decisions Log
- **Date**: May 2, 2026
- **Decision**: Chose .NET Core + Next.js stack over full TypeScript
- **Reasoning**: Owner expertise in C#, better Azure integration, enterprise-grade features

### Important Reminders
- This is a public GitHub repository - maintain professional standards
- Focus on mobile-first design due to target market
- Keep future payment integration in mind when designing APIs
- Document all Azure resource configurations for reproducibility

---

## 🤝 Contribution Guidelines

### For External Contributors
- Follow existing code style and conventions
- Write tests for new features
- Update documentation for changes
- Respect the project's scope and vision

### For AI Assistants
- Always check this document for current priorities
- Reference DEVELOPMENT_CONTEXT.md for full project understanding
- Update this file when resolving issues or adding new challenges
- Maintain professional tone suitable for public repository

---

*This document is actively maintained and updated as the project evolves. Check back regularly for the latest status and priorities.*