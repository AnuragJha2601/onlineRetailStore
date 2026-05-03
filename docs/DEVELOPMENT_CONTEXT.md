# Development Context Document

## Project Overview
**Dhanak Trinket** - E-commerce platform for ethnic finds: bangles, necklaces, imitation jewelry, and future ethnic wear. Built with ASP.NET Core 9.0 backend and Next.js 16 frontend, live on Azure.

---

## Quick Context Summary

### Business Context
- **Owner**: Running jewelry retail business
- **Product Source**: Wholesale bangles and imitation jewelry
- **Current Status**: Live in production — catalog + admin operations dashboard
- **Future Goals**: Full e-commerce with payment integration
- **Target Market**: Mobile-first Indian market

### Technical Decisions Made
- **Frontend**: Next.js 16 with TypeScript (static export, SEO-friendly, image optimization)
- **Backend**: ASP.NET Core 9.0 Web API (owner is C# expert)
- **Database**: Azure SQL Database (EF Core code-first; SQLite for local dev)
- **Cloud**: Azure ecosystem (App Service, Static Web Apps, Blob Storage)
- **Auth**: JWT Bearer, BCrypt.Net-Next, single `dhanakadmin` user

---

## Current Project Structure

### Repository Organization
```
onlineRetailStore/
├── README.md
├── PROJECT_STATUS.md
├── DEPLOYMENT_STATUS.md
├── docs/
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── DEVELOPMENT_CONTEXT.md      # This file
│   └── OPEN_ISSUES.md
├── .ai/
│   └── instructions.md             # AI assistant quick context
├── .github/
│   ├── copilot-instructions.md     # GitHub Copilot context
│   └── workflows/                  # GitHub Actions (frontend auto-deploy)
├── backend/
│   ├── DhanakTrinket.Api/          # ASP.NET Core Web API
│   ├── DhanakTrinket.Core/         # Domain models, DTOs, interfaces
│   └── DhanakTrinket.Infrastructure/ # EF Core DbContext, migrations, blob service
└── frontend/
    └── dhanak-trinket-frontend/    # Next.js 16 TypeScript app
        └── src/
            ├── app/                # App Router pages (/, /admin, /login)
            ├── components/         # UI components (InventoryScreen, SalesScreen, ExpensesScreen...)
            ├── services/           # productApi.ts — all API calls + formatPrice/formatDate
            ├── types/              # product.ts — all TypeScript types
            └── contexts/           # AuthContext.tsx
```

---

## Live Deployment

| Resource | Value |
|---|---|
| Customer Store | `https://blue-ocean-089852300.7.azurestaticapps.net` |
| Admin Panel | `https://blue-ocean-089852300.7.azurestaticapps.net/admin` |
| Backend API | `https://api-dhanak-trinket-2026.azurewebsites.net` |
| Azure SQL | `db-dhanak-trinket` on `sql-dhanak-trinket-prod` |
| Blob Storage | `stdhanak2026prod` — `product-images` container |

### Deployment Commands
```bash
# Backend (manual)
dotnet publish DhanakTrinket.Api -c Release -o ./publish
Compress-Archive ./publish/* deploy.zip -Force
az webapp deploy --resource-group rg-dhanak-trinket-prod --name api-dhanak-trinket-2026 --src-path deploy.zip --type zip

# Frontend — auto-deploys on git push to main via GitHub Actions
git push origin main
```

---

## What's Live

### Admin Features (all behind `/admin`, JWT-protected)
1. **Inventory tab** — Product list with "Mark as Sold" per row (Retail/Wholesale modal)
2. **Expenses tab** — Expense list + inline add form, optional bill image upload to Blob
3. **Sales tab** — Sales list + inline form (retail: catalog dropdown or custom item; wholesale: description + total)
4. **Add Product tab** — Upload new jewelry product with images

### Customer Catalog (public)
- Browse products by category, search, filter in-stock
- Product likes counter

---

## Development Priorities

### Current (May 2026)
- Edit/delete products in admin panel
- Product detail page for catalog items
- P&L dashboard — monthly revenue vs expenses

### Phase 2 — Planned
- Wholesale line-item breakdown (structured items vs single description)
- Customer CRM — link sales to customer profiles
- Export to CSV (sales / expenses)
- Google OAuth admin login
- Inventory low-stock alerts
- Shopping cart + checkout + Razorpay/Stripe

---

## Key Environment Variables (Azure App Service)

```
Jwt__Secret               — JWT signing key
AdminAuth__Username       — dhanakadmin
AdminAuth__PasswordHash   — BCrypt hash
ConnectionStrings__DefaultConnection — Azure SQL connection string
AzureStorage__ConnectionString       — Blob Storage connection string
AzureStorage__ContainerName          — product-images
```

---

## Known Gotchas

- `apiRequest` spread order: `...options` first, then `headers` override — prevents Content-Type from being overwritten
- FormData uploads: never set `Content-Type`; browser must set multipart boundary
- `PendingModelChangesWarning`: suppressed in `Program.cs` with `ConfigureWarnings`
- Azure SQL: `TEXT` columns cannot have `DEFAULT` constraint — use `nvarchar`
- Provider-aware migrations: use `migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer"` to branch SQL Server vs SQLite DDL
- localStorage key: always `dhanak_admin_token` in both `AuthContext.tsx` and `productApi.ts`

├── frontend/                     # Next.js application (TBD)

- Inventory low-stock alerts
- Shopping cart + checkout + Razorpay/Stripe

---

## Key Environment Variables (Azure App Service)

```
Jwt__Secret               — JWT signing key
AdminAuth__Username       — dhanakadmin
AdminAuth__PasswordHash   — BCrypt hash
ConnectionStrings__DefaultConnection — Azure SQL connection string
AzureStorage__ConnectionString       — Blob Storage connection string
AzureStorage__ContainerName          — product-images
```

---

## Known Gotchas

- `apiRequest` spread order: `...options` first, then `headers` override — prevents Content-Type from being overwritten
- FormData uploads: never set `Content-Type`; browser must set multipart boundary
- `PendingModelChangesWarning`: suppressed in `Program.cs` with `ConfigureWarnings`
- Azure SQL: `TEXT` columns cannot have `DEFAULT` constraint — use `nvarchar`
- Provider-aware migrations: use `migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer"` to branch SQL Server vs SQLite DDL
- localStorage key: always `dhanak_admin_token` in both `AuthContext.tsx` and `productApi.ts`
