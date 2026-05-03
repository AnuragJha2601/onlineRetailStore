# Open Issues & Challenges

## Current Status
**Project Phase**: Live in Production  
**Last Updated**: May 3, 2026

---

## ✅ Completed

### Infrastructure
- [x] Azure App Service (`api-dhanak-trinket-2026`)
- [x] Azure Static Web Apps `blue-ocean-089852300.7.azurestaticapps.net`
- [x] Azure SQL Database (`db-dhanak-trinket`)
- [x] Azure Blob Storage (`stdhanak2026prod`, `product-images` container; bills at `expenses/YYYY/MM/DD/`)

### Backend
- [x] ASP.NET Core 9.0 Web API — Clean Architecture (Core/Infrastructure/Api)
- [x] EF Core with Azure SQL (Managed Identity auth); provider-aware migrations (SQL Server / SQLite)
- [x] Full CRUD for products + image upload
- [x] CORS configured — explicit `WithOrigins` list for Static Web App URL
- [x] Image upload: private blob container, SAS URLs generated on read
- [x] Standardized `ApiResponse<T>` wrapper
- [x] `PendingModelChangesWarning` suppressed in Program.cs

### Frontend
- [x] Next.js 16 static export deployed to Azure Static Web Apps
- [x] Customer catalog with search and category filter
- [x] Production API URL baked in via GitHub Actions env var
- [x] SPA routing via `staticwebapp.config.json`

### Admin Auth
- [x] JWT Bearer auth — single `dhanakadmin` user, credentials in App Service env vars
- [x] BCrypt.Net-Next password hashing (8-hour tokens)
- [x] Login page at `/login` → stores JWT in localStorage key `dhanak_admin_token`
- [x] `AuthContext` + `useAuth` hook
- [x] Admin page protected — redirects to `/login` when not authenticated

### Admin Dashboard — Tabbed UI
- [x] 4 tabs: **Inventory** | **Expenses** | **Sales** | **Add Product**
- [x] Each tab manages its own state independently

### Inventory Management
- [x] Products table with "Mark as Sold" button per row
- [x] `MarkAsSoldModal` — Retail/Wholesale toggle, date, qty, price, channel, customer/buyer details
- [x] Client-side stock decrement on successful sale

### Expenses Tracking (May 3, 2026)
- [x] `Expense` entity: `ExpenseDate`, `Description`, `Amount`, `Category` (enum), `VendorName?`, `BillImagePath?`, `Notes?`
- [x] `ExpenseCategory` enum: `InventoryPurchase`, `Packaging`, `Shipping`, `Marketing`, `Other`
- [x] `ExpensesController`: `POST /api/expenses`, `POST /api/expenses/{id}/bill`, `GET /api/expenses`, `DELETE /api/expenses/{id}`
- [x] Bill image upload to Azure Blob Storage (`expenses/YYYY/MM/DD/` prefix), SAS URL returned
- [x] EF migration for Expenses table — provider-aware (SQL Server uses raw SQL DDL; SQLite uses EF methods)
- [x] `ExpensesScreen` frontend — list-first, inline add form, "View bill" link per row

### Sales Tracking (May 3, 2026)
- [x] `Sale` + `WholesaleDeal` entities
- [x] `SalesController`: `POST /api/sales`, `GET /api/sales`, `GET /api/sales/summary`, `DELETE /api/sales/{id}`
- [x] `RecordSaleRequest.ProductId` is `int?` — supports custom items and wholesale deals without a catalog product
- [x] Stock decremented only when `ProductId` is provided; restored on DELETE
- [x] `SalesScreen` frontend — Retail/Wholesale toggle, catalog product dropdown (auto-fills price), custom item option, client-side list update
- [x] `productApi.recordSale()`, `getSales()`, `getSalesSummary()`, `deleteSale()` added

### Bug Fixes (May 3, 2026)
- [x] `apiRequest` spread order fixed — `...options` first, then `headers` override (was silently overwriting Content-Type)
- [x] FormData uploads skip `Content-Type` default so browser sets multipart boundary
- [x] localStorage key mismatch fixed — `dhanak_admin_token` used consistently in both `AuthContext` and `productApi`
- [x] Azure SQL `TEXT DEFAULT` error — provider-aware migration uses `nvarchar` for SQL Server

---

## 🚧 Open / Pending

### Immediate
- [ ] Move blob connection string from `appsettings.Production.json` to Azure App Service environment variables
- [ ] Remove base64 fallback in `UploadProductImage` — blob storage works, fallback is no longer needed
- [ ] Re-seed products with real photos (current seed data has no images)
- [ ] Edit/delete products in admin panel

### Features Missing
- [ ] Product detail page (clicking a catalog item does nothing)
- [ ] Like functionality wired up end-to-end (field exists, no UI)
- [ ] GitHub Actions workflow for backend deploy (currently manual `az webapp deploy`)

---

## 📅 Planned Features

### P&L Dashboard
- Monthly revenue (Sales) vs expenses chart + summary table
- `Profit = SUM(Sales.TotalAmount) − SUM(Expenses.Amount)` per month

### Wholesale Line-Item Breakdown
- Replace single description field with structured line items (SKU, quantity, unit price)

### Customer Management / CRM
- Link sales to customer profiles; view purchase history per customer

### Dual Pricing (Cost Price + Selling Price)
- Add `CostPrice` (admin-only) and `SellingPrice` (public) to Product
- Auto-suggest selling price at +35% markup, overridable

### Export to CSV
- Download sales and expense data for offline accounting

### Other
- Google OAuth admin login (replace username/password)
- Inventory low-stock alerts (push or email)
- Discount / promo codes
- Shopping cart + checkout + payment (Razorpay/Stripe) for direct purchase mode
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