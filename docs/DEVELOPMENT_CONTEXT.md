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
- **No per-product CostPrice**: Removed in May 2026. Cost prices are sensitive business data and must not be exposed on the wire (even admin endpoints might be cached/logged). P&L is tracked via the Expenses tab (bulk purchase invoices) vs Sales tab. Per-product cost tracking is a future feature.

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
1. **Inventory tab** — Product list with 40×40 thumbnail + "Mark as Sold" per row (Retail/Wholesale modal)
2. **Expenses tab** — Expense list + inline add form, optional bill image upload to Blob
3. **Sales tab** — Sales list + inline form (retail: catalog dropdown or custom item; wholesale: description + total)
4. **Add Product tab** — Upload new jewelry product with multiple images

### Customer Catalog (public)
- Browse all products (in-stock and sold-out) by category, search, in-stock filter
- Product cards show thumbnail (public blob URL, no expiry, CDN-cacheable)
- Clicking a card image opens `ProductDetailModal` which lazily loads the full-resolution image via SAS
- Product likes counter (backend + API ready; UI trigger not wired yet)

---

## Image Architecture

| Concern | Approach |
|---|---|
| Full-size image | Private `product-images` container; blob path stored in `ProductImage.BlobPath` |
| Thumbnail | Public `product-thumbnails` container; plain `https://` URL stored in `ProductImage.ThumbnailUrl` |
| List API (`GET /api/products`) | Returns `ThumbnailUrl` as-is — **zero blob SDK calls** |
| Detail API (`GET /api/products/{id}`) | Generates one 30-min SAS for full image — called only on modal open |
| Thumbnail generation | `SixLabors.ImageSharp` v3.1.7 on upload — max 300×300, JPEG quality 75 |
| Azure prerequisite | Storage account must have "Allow Blob anonymous access" = Enabled |

---

## Development Priorities

### Immediate (May 2026)
- Enable anonymous access on `stdhanak2026prod` storage account (for public thumbnails)
- Edit/delete products in admin panel
- Wire up Like button in catalog UI
- P&L dashboard — monthly revenue vs expenses chart + table

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
Jwt__Secret                              — JWT signing key
AdminAuth__Username                      — dhanakadmin
AdminAuth__PasswordHash                  — BCrypt hash
ConnectionStrings__DefaultConnection     — Azure SQL connection string
AzureStorage__ConnectionString           — Blob Storage connection string
AzureStorage__ContainerName              — product-images (full images)
```
Note: `product-thumbnails` container is auto-created by the app on first upload (public access).

---

## Publish / Deploy Commands

```powershell
# Backend (manual) — must kill VS Code dotnet process first to avoid MSBuild lock
Get-Process dotnet | Stop-Process -Force
Remove-Item -Recurse -Force backend/DhanakTrinket.Core/obj/Release
Remove-Item -Recurse -Force backend/DhanakTrinket.Infrastructure/obj/Release
Remove-Item -Recurse -Force backend/DhanakTrinket.Api/obj/Release
cd backend
dotnet publish DhanakTrinket.Api/DhanakTrinket.Api.csproj -c Release -o C:\temp\dhanak-pub --nologo /p:UseSharedCompilation=false
Compress-Archive C:\temp\dhanak-pub\* C:\temp\deploy.zip -Force
az webapp deploy --name api-dhanak-trinket-2026 --resource-group rg-dhanak-trinket-prod --src-path C:\temp\deploy.zip --type zip --async true

# Frontend — auto-deploys on git push to main via GitHub Actions
git push origin main
```

---

## Known Gotchas

- **MSBuild lock**: VS Code's Roslyn language server locks DLL files. Always kill `dotnet` processes + delete `obj/Release` folders before publishing. Use `/p:UseSharedCompilation=false`. Output to `C:\temp\`, never inside the repo.
- **`apiRequest` spread order**: `...options` first, then `headers` override — prevents Content-Type being overwritten
- **FormData uploads**: never set `Content-Type`; browser must set multipart boundary
- **`PendingModelChangesWarning`**: suppressed in `Program.cs` with `ConfigureWarnings`
- **Azure SQL `TEXT DEFAULT`**: cannot have `DEFAULT` constraint — use `nvarchar` instead
- **Provider-aware migrations**: branch on `migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer"` for SQL Server vs SQLite DDL
- **localStorage key**: always `dhanak_admin_token` in both `AuthContext.tsx` and `productApi.ts`
- **Public thumbnail container**: requires "Allow Blob anonymous access" = Enabled on storage account (`stdhanak2026prod` → Settings → Configuration)
