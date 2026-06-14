# Open Issues & Challenges

## Current Status
**Project Phase**: Live in Production  
**Last Updated**: June 2, 2026

---

## ✅ Completed

### Infrastructure
- [x] Azure App Service (`api-dhanak-trinket-2026`)
- [x] Azure Static Web Apps `blue-ocean-089852300.7.azurestaticapps.net`
- [x] Azure SQL Database (`db-dhanak-trinket`)
- [x] Azure Blob Storage (`stdhanak2026prod`)
  - `product-images` container (private) — full-size images, SAS URLs
  - `product-thumbnails` container (public blob access) — 300×300 thumbnails, plain HTTPS URLs
  - `expenses/YYYY/MM/DD/` prefix — bill images

### Backend
- [x] ASP.NET Core 9.0 Web API — Clean Architecture (Core/Infrastructure/Api)
- [x] EF Core with Azure SQL (Managed Identity auth); provider-aware migrations (SQL Server / SQLite)
- [x] Full CRUD for products + image upload
- [x] CORS configured — explicit `WithOrigins` list for Static Web App URL
- [x] Standardized `ApiResponse<T>` wrapper
- [x] `PendingModelChangesWarning` suppressed in Program.cs
- [x] `SixLabors.ImageSharp` (v3.1.7) for server-side thumbnail generation on upload

### Image Architecture (May 2026)
- [x] On upload: full image → private `product-images` blob; 300×300 JPEG thumbnail → public `product-thumbnails` blob
- [x] `ProductImage` entity has both `BlobPath` (full) and `ThumbnailUrl` (plain HTTPS thumbnail URL)
- [x] `GET /api/products` (list): returns `ThumbnailUrl` as-is — zero blob SDK calls
- [x] `GET /api/products/{id}` (detail): generates one SAS URL for full image — called lazily on modal open only
- [x] `ProductFilterRequest.InStockOnly` default removed — public catalog returns all products including sold-out

### Frontend
- [x] Next.js 16 static export deployed to Azure Static Web Apps
- [x] Customer catalog with search, category filter, in-stock toggle
- [x] Production API URL baked in via GitHub Actions env var
- [x] SPA routing via `staticwebapp.config.json`
- [x] Logo (`/public/logo.jpg`) shown in catalog header, admin header, and login page

### Catalog UX (May 2026)
- [x] Product cards show thumbnail (fast, cached, no expiry)
- [x] Clicking a product card image opens `ProductDetailModal`
- [x] Modal fetches `GET /api/products/{id}` on open → shows thumbnail immediately, swaps to full SAS image when ready
- [x] Sold-out products visible when "In Stock Only" is unchecked

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
- [x] Products table with 40×40 thumbnail per row (📷 placeholder if no image)
- [x] "Mark as Sold" button per row → `MarkAsSoldModal`
- [x] `MarkAsSoldModal` — Retail/Wholesale toggle, date, qty, price, channel, customer/buyer details
- [x] Client-side stock decrement on successful sale

### Expenses Tracking
- [x] `Expense` entity: `ExpenseDate`, `Description`, `Amount`, `Category` (enum), `VendorName?`, `BillImagePath?`, `Notes?`
- [x] `ExpenseCategory` enum: `InventoryPurchase`, `Packaging`, `Shipping`, `Marketing`, `Other`
- [x] `ExpensesController`: `POST /api/expenses`, `POST /api/expenses/{id}/bill`, `GET /api/expenses`, `DELETE /api/expenses/{id}`
- [x] Bill image upload to Azure Blob Storage, SAS URL returned
- [x] `ExpensesScreen` frontend — list-first, inline add form, "View bill" link per row

### Sales Tracking
- [x] `Sale` entity (WholesaleDeals table removed — flattened into Sales: `BuyerName`, `BuyerPhone` on Sale row)
- [x] `SalesController`: `POST /api/sales`, `GET /api/sales`, `GET /api/sales/summary`, `DELETE /api/sales/{id}`
- [x] `RecordSaleRequest.ProductId` is `int?` — supports custom items and wholesale without catalog product
- [x] Stock decremented only when `ProductId` is provided; restored on DELETE
- [x] `SalesScreen` frontend — Retail/Wholesale toggle, catalog dropdown, custom item option

### Bug Fixes
- [x] `apiRequest` spread order fixed — `...options` first, then `headers` override
- [x] FormData uploads skip `Content-Type` default
- [x] localStorage key mismatch fixed — `dhanak_admin_token` consistent everywhere
- [x] Azure SQL `TEXT DEFAULT` error — provider-aware migration uses `nvarchar`
- [x] FK constraint name bug in `FlattenWholesaleIntoSales` migration fixed (was `FK_Sales_WholesaleDeals_WholesaleDealId`, corrected to `FK_Sales_WholesaleDeals`)
- [x] Duplicate "Dhanak Trinket" heading removed from `ProductCatalog.tsx`

---

## 🚧 Open / Pending

### Immediate
- [ ] Remove legacy password auth (backend endpoint + frontend toggle) after Google OAuth verified stable
- [ ] Remove old Azure env vars: `AdminAuth__Username`, `AdminAuth__PasswordHash`
- [ ] Rotate Azure Storage access keys (app no longer uses them after MI migration)
- [ ] Re-seed/replace placeholder seed products with real photos
- [ ] Edit/delete products in admin panel

### Features Missing
- [ ] Like functionality: API + backend + localStorage deduplication done; heart button shows filled/disabled state. Needs final review.
- [ ] GitHub Actions workflow for backend deploy (currently manual `az webapp deploy`)

---

## 📅 Planned Features

### Product Code Generator (next up — new admin tab + migration)
A pricing-dictionary tool used right after buying products from wholesale market, before photos are ready.

**Business workflow:**
- Each unique (base price, MRP) pair gets a reusable code like `B01`, `E05`
- Code prefix = category: `B` = Bangles, `E` = Earrings, `N` = Necklaces, `R` = Rings, etc.
- Sequential numbering per category, auto-assigned on creation
- Multiple physical products can share the same code if pricing is identical
- Code is written on the physical product tag for later lookup

**Admin screen — two modes:**
1. **Tag a new product**: Enter base price → system suggests existing combos with that price (e.g., `150–300 → B12`, `150–350 → B16`). If match found → click → show code. If no match → enter MRP + pick category → system creates new code.
2. **Look up a code**: Enter code (e.g., `B12`) → instantly see base price, MRP, margin%.

**Data model:**
```
PricingCode { Id, Code ("B01"), CategoryPrefix ("B"), SequenceNumber (1),
             BasePrice (decimal), RetailPrice (decimal),
             CreatedAt, LinkedProductId? (FK → Product, nullable) }
```
- Optionally linkable to a catalog Product when photos are eventually added
- 20–30 entries per wholesale trip (bulk-friendly UI)
- Base price is sensitive — admin-only, never exposed via public API
- **New "Product Codes" tab** in admin dashboard (5th tab)
- **Backend**: `PricingCodesController` — `POST /api/pricing-codes`, `GET /api/pricing-codes?basePrice=`, `GET /api/pricing-codes/{code}`, `GET /api/pricing-codes`
- **Migration**: New `PricingCodes` table

### P&L Dashboard
- Monthly revenue (Sales) vs expenses chart + summary table
- `Profit = SUM(Sales.TotalAmount) − SUM(Expenses.Amount)` per month

### Wholesale Line-Item Breakdown (future — do NOT build yet)
Currently a wholesale sale is a **single `Sale` row** — `BuyerName`/`BuyerPhone` on
`Sale`, item description in `Notes`, deal total in `SellingPrice`.

When multi-line wholesale is needed, the planned design is:
```
WholesaleOrder  { Id, BuyerName, BuyerPhone, OrderDate, TotalAmount, Notes, CreatedAt }
Sale            { ..., WholesaleOrderId? FK → WholesaleOrder }  ← becomes a line item
```
Each `Sale` row = one SKU + qty + unit price. `WholesaleOrder` = header.
Requires new migration, new controller endpoint, and UI redesign. **Do not add
`WholesaleOrders` table or FK until this feature is explicitly requested.**

### SEO Improvements (long-term)
- **Backend dynamic sitemap**: `GET /api/sitemap` endpoint that generates XML sitemap with all product URLs (`/product/{id}/`). SWA route rewrites `/sitemap.xml` → backend endpoint. Updates automatically as products are added/sold.
- **Server-side meta tags**: For proper WhatsApp/social link previews with product images, consider an Azure Function or middleware that injects `og:title`, `og:image`, `og:description` into the HTML `<head>` before serving `/product/*` pages. Client-side meta updates (current approach) are visible to users but not to most social media crawlers.
- **Structured data (JSON-LD)**: Add `Product` schema markup to product pages for rich Google results (price, availability, image, reviews).
- **Canonical URLs per product**: Each `/product/{id}/` page should have `<link rel="canonical" href="https://dhanaktrinket.in/product/{id}/" />`.
- **Image alt text audit**: Ensure all product images have descriptive alt text for image search ranking.

### Customer Management / CRM
- Link sales to customer profiles; view purchase history per customer

### Per-Product Cost Price (future)
- **Decision (May 2026)**: Removed for security — cost data must not appear on the wire/in logs. P&L tracked via Expenses vs Sales tabs.
- Future: server-side only field, never returned by any API endpoint.

### Export to CSV
- Download sales and expense data for offline accounting

### Other\n- Google OAuth admin login — ✅ Done (June 2026)\n- Inventory low-stock alerts (push or email)\n- Discount / promo codes\n- Shopping cart + checkout + payment (Razorpay/Stripe) for direct purchase mode\n\n---

*This document is actively maintained and updated as the project evolves. Check back regularly for the latest status and priorities.*