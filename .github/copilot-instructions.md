# GitHub Copilot Instructions

## Project Context
You are working on **Dhanak Trinket**, an e-commerce platform for ethnic finds including bangles, necklaces, imitation jewelry, and future expansion to ethnic wear built with .NET Core backend and Next.js frontend.

## Key Information
- **Tech Stack**: ASP.NET Core 9.0 Web API + Next.js 16 with TypeScript
- **Database**: Azure SQL Database (Managed Identity) + Azure Blob Storage (Managed Identity)
- **Cloud**: Azure ecosystem (App Service, Static Web Apps, CDN)
- **Auth**: Google OAuth for admin login (JWT issued by backend); legacy password fallback kept temporarily
- **Owner Expertise**: Strong in C#, building scalable jewelry catalog

## Code Style & Conventions

### Backend (.NET Core)
- Use **Clean Architecture** principles with separate layers
- Follow **PascalCase** for public members, **camelCase** for private
- Implement **Repository pattern** with dependency injection
- Use **FluentValidation** for request validation
- Apply **async/await** for all database operations
- Prefer **LINQ** over loops where appropriate

```csharp
// Preferred controller structure
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    
    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }
    
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ProductDto>>>> GetProducts(
        [FromQuery] ProductFilterRequest request)
    {
        var products = await _productService.GetProductsAsync(request);
        return Ok(ApiResponse<List<ProductDto>>.Success(products));
    }
}
```

### Frontend (Next.js)
- Use **TypeScript strictly** - no `any` types
- Follow **React functional components** with hooks
- Use **Tailwind CSS** for styling with custom design system
- Implement **proper error boundaries** and loading states
- Apply **Next.js Image component** for all product images

```tsx
// Preferred component structure
interface ProductCardProps {
  product: Product;
  onLike: (productId: number) => Promise<void>;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onLike }) => {
  const [isLiking, setIsLiking] = useState(false);
  
  const handleLike = async () => {
    setIsLiking(true);
    try {
      await onLike(product.id);
    } finally {
      setIsLiking(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* Component implementation */}
    </div>
  );
};
```

## Database & Entity Guidelines
- Use **Entity Framework Core** with code-first approach
- Apply proper **navigation properties** for relationships
- Implement **soft deletes** where appropriate
- Add **audit fields** (CreatedAt, UpdatedAt) to entities

```csharp
public class JewelryProduct
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ProductCategory Category { get; set; }
    public decimal Price { get; set; }
    public bool IsInStock { get; set; }
    public int LikesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual List<ProductImage> Images { get; set; } = new();
}
```

## API Design Principles
- Follow **RESTful conventions** with consistent naming
- Use **proper HTTP status codes** (200, 201, 400, 404, 500)
- Implement **standardized response format**:

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
}
```

## Business Logic Priorities
- **Product catalog** is the core feature - optimize for browsing
- **Mobile-first** approach - 70% traffic expected from mobile
- **Image optimization** crucial for jewelry photos
- **Stock management** - real-time updates needed
- **Future e-commerce** - design APIs with checkout/payment in mind

## Security & Performance
- Always validate input with **FluentValidation**
- Use **parameterized queries** to prevent SQL injection  
- Implement **CORS** properly for frontend-backend communication
- Apply **image optimization** and **CDN** for product photos
- Design for **scalability** from day one

## Testing Preferences
- Write **unit tests** for business logic and services
- Create **integration tests** for API endpoints
- Use **test data builders** for complex entities
- Mock external dependencies (Azure services)

## File Organization
```
backend/
├── JewelryHaven.Api/          # Web API project
├── JewelryHaven.Core/         # Domain models & interfaces  
├── JewelryHaven.Infrastructure/ # Data access & external services
└── JewelryHaven.Tests/        # Test projects

frontend/
├── components/                # Reusable UI components
├── pages/                     # Next.js pages
├── hooks/                     # Custom React hooks
├── services/                  # API communication
├── types/                     # TypeScript type definitions
└── utils/                     # Helper functions
```

## Common Patterns to Suggest
- **Result pattern** for error handling instead of exceptions
- **CQRS** with MediatR for complex operations
- **Specification pattern** for dynamic queries
- **DTO mapping** with AutoMapper between layers

## Implemented Features (as of June 2026)
- Product catalog with images (Azure Blob Storage, public thumbnails + private full images)
- **Admin authentication (June 2026)**: Google OAuth primary login + legacy password fallback; per-IP rate limiting (5 req/min) on auth endpoints
  - Frontend: `@react-oauth/google` GoogleLogin component, `GoogleOAuthWrapper` context, password form behind "Use password login" toggle
  - Backend: `POST /api/auth/google-login` validates Google ID token, checks email against `AdminAuth:AllowedEmails` config array, issues JWT
  - Backend: `POST /api/auth/login` legacy endpoint kept as fallback (returns 503 if env vars not set)
  - Allowed admin emails configured via Azure env vars: `AdminAuth__AllowedEmails__0`, `__1`, `__2`
  - Google OAuth Client ID: configured via `GoogleAuth__ClientId` env var in Azure App Service
  - Rate limiting: `[EnableRateLimiting("auth")]` on AuthController, partitioned by `RemoteIpAddress`
- Inventory management: add product (multi-image upload), mark as sold, stock tracking, thumbnail per row
- Expenses tracking: create expense with category + optional bill image upload
- Sales recording: retail (catalog or custom item) + wholesale (description + total)
- Admin dashboard: tabbed UI — Inventory | Expenses | Sales | Add Product
- Logo shown in catalog header, admin header, and login page
- Clickable product cards: thumbnail in catalog grid → `ProductDetailModal` with lazy full-image load
- `InStockOnly` filter defaults to `null` — public catalog returns all products by default
- **Product pricing & code** (May 2026): `ProductCode` (auto-generated short code), `Price` (MRP), `PariPrice?`, `WholesalePrice?` on every product. Admin inventory shows all pricing columns; public catalog shows MRP only.
- **Separate admin products endpoint**: `GET /api/products/admin` returns `AdminProductDto` (adds `PariPrice`/`WholesalePrice`); public `GET /api/products` returns `ProductDto` (MRP only).
- **`EditProductModal`**: admin can edit all product fields including channel prices.
- **Like button localStorage deduplication**: heart button disabled/filled after first click per browser; liked IDs stored in `dhanak_liked_products` localStorage key.

## Image & Blob Architecture
- **Upload**: `POST /api/products/{id}/images` generates a 300×300 JPEG thumbnail (SixLabors.ImageSharp v3.1.7) and uploads both full image and thumbnail to separate blob containers
- **Full image**: private `product-images` container; `BlobPath` stored in `ProductImage`; SAS URL generated on `GET /api/products/{id}` only
- **Thumbnail**: public `product-thumbnails` container; plain `https://` URL stored in `ProductImage.ThumbnailUrl`; returned as-is from list API — **zero blob SDK calls on list**
- **Azure prerequisite**: storage account must have "Allow Blob anonymous access" = Enabled
- **Blob auth (June 2026)**: Uses `DefaultAzureCredential` (Managed Identity) in production — no storage connection string needed. SAS URLs use User Delegation Key. Local dev uses `UseDevelopmentStorage=true` in `appsettings.Development.json`.

## Deployment
- **Backend**: Azure App Service `api-dhanak-trinket-2026`, manually `dotnet publish → zip → az webapp deploy`
  - Must kill VS Code dotnet process before publishing: `Get-Process dotnet | Stop-Process -Force`
  - Use `/p:UseSharedCompilation=false`, output to `C:\temp\dhanak-pub-<timestamp>` (not inside repo)
  - Publish command: `$ts = Get-Date -Format 'yyyyMMdd-HHmmss'; dotnet publish backend/DhanakTrinket.Api/DhanakTrinket.Api.csproj -c Release -o "C:\temp\dhanak-pub-$ts" --nologo /p:UseSharedCompilation=false`
  - Deploy: `Compress-Archive -Path "C:\temp\dhanak-pub-$ts\*" -DestinationPath "C:\temp\dhanak-pub-$ts.zip" -Force; az webapp deploy --resource-group rg-dhanak-trinket-prod --name api-dhanak-trinket-2026 --src-path "C:\temp\dhanak-pub-$ts.zip" --type zip --clean true`
- **Frontend**: Azure Static Web Apps `blue-ocean-089852300.7.azurestaticapps.net`, auto-deploys on `git push` via GitHub Actions
  - **Custom domain**: `dhanaktrinket.in`
  - Build env vars set in `.github/workflows/azure-static-web-apps-blue-ocean-009852300.yml` (NOT in `.env.production`)
  - Frontend `.env*` files are gitignored — `.env.local` for local dev only, production values come from GitHub Actions workflow
- **Database**: Azure SQL `db-dhanak-trinket` on `sql-dhanak-trinket-prod.database.windows.net`. Uses Managed Identity (`Authentication=Active Directory Default`). EF migrations run on startup. Provider branching: checks `.database.windows.net` in connection string → SQL Server; otherwise → SQLite.
- **Auth localStorage key**: `dhanak_admin_token` — must be consistent in both `AuthContext.tsx` and `productApi.ts`
- **Resource group**: `rg-dhanak-trinket-prod`

## Azure App Service Environment Variables
```
Jwt__Secret                              — JWT signing key
AdminAuth__Username                      — dhanakadmin (legacy, remove after Google OAuth verified)
AdminAuth__PasswordHash                  — BCrypt hash (legacy, remove after Google OAuth verified)
GoogleAuth__ClientId                     — Google OAuth client ID
AdminAuth__AllowedEmails__0              — anurocks144@gmail.com
AdminAuth__AllowedEmails__1              — dhanaktrinket@gmail.com
AdminAuth__AllowedEmails__2              — taniyagupta250295@gmail.com
ConnectionStrings__DefaultConnection     — Azure SQL MI connection string
AzureStorage__AccountName                — stdhanak2026prod (blob MI, no connection string)
```

## Known Gotchas
- `apiRequest` spread order: always put `...options` **first**, then override `headers` — otherwise the headers object is overwritten
- FormData uploads: do NOT set `Content-Type` header; let the browser set the multipart boundary automatically
- `PendingModelChangesWarning`: suppress with `options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning))` in Program.cs
- Azure SQL `TEXT` column: cannot have a `DEFAULT` constraint — use `nvarchar` instead
- MSBuild file locking: VS Code Roslyn locks DLLs during publish — always kill `dotnet` processes and clear `obj/Release` first
- Public thumbnail container: requires "Allow Blob anonymous access" = Enabled on `stdhanak2026prod` storage account

## Future Features (Planned)
### Product Code Generator (next up — new admin tab + migration)
A pricing-dictionary tool used right after buying from wholesale market, before product photos are ready.

**Business workflow:**
- Each unique (base price, MRP) pair gets a reusable code like `B01`, `E05`
- Code prefix maps to category: `B` = Bangles, `E` = Earrings, `N` = Necklaces, `R` = Rings, etc.
- Sequential numbering per category, auto-assigned
- Multiple physical products share the same code if pricing is identical
- Code is written on the physical product tag for later lookup

**Admin screen — two modes:**
1. **Tag a new product**: Enter base price → system suggests existing combos (e.g., `150–300 → B12`). Match → click → show code. No match → enter MRP + pick category → new code created.
2. **Look up a code**: Enter code `B12` → see base price, MRP, margin%.

**Data model:**
```
PricingCode { Id, Code, CategoryPrefix, SequenceNumber,
             BasePrice, RetailPrice, CreatedAt, LinkedProductId? FK }
```
- Optionally linkable to a catalog product later
- 20–30 entries per wholesale trip (bulk-friendly UI needed)
- Base price is sensitive — admin-only endpoint, never on public API
- **New "Product Codes" tab** in admin dashboard (5th tab)
- **Backend**: `PricingCodesController` — `POST /api/pricing-codes`, `GET /api/pricing-codes?basePrice=`, `GET /api/pricing-codes/{code}`, `GET /api/pricing-codes`
- **Migration**: New `PricingCodes` table

### P&L Dashboard (frontend only, no migrations)
- **New "P&L" tab** in admin dashboard (5th tab)
- **Backend**: Add `GET /api/expenses/summary?year=` endpoint (groups expenses by month + category totals), mirrors existing `GET /api/sales/summary`
- **Summary cards**: Total Revenue | Total Expenses | Net Profit/Loss (top row)
- **Monthly bar chart**: CSS-only side-by-side bars (green revenue, red expenses) — no chart library
- **Monthly breakdown table**: Revenue, Expenses, Profit, Margin% per month; expandable rows show expense category breakdown
- **Year selector** dropdown at top
- **Mobile**: cards stack, chart uses horizontal bars, table collapses to cards
- **Data source**: `getSalesSummary(year)` + new `getExpensesSummary(year)` — 2 API calls total

### Wholesale Line-Item Breakdown (future — do NOT build yet)
Currently a wholesale sale is a **single `Sale` row** with:
- `SaleType = Wholesale`
- `BuyerName` / `BuyerPhone` directly on `Sale`
- Item description in `Notes`, total in `SellingPrice`

When multi-line wholesale is built, the intended design is:
```
WholesaleOrder  { Id, BuyerName, BuyerPhone, OrderDate, TotalAmount, Notes, CreatedAt }
Sale            { ..., WholesaleOrderId? FK → WholesaleOrder }
```
Each `Sale` row becomes a line item (one SKU + qty + unit price). The `WholesaleOrder`
is the header. This requires a new migration and UI redesign — **do not add a
`WholesaleOrders` table or `WholesaleOrderId` FK to Sales until that feature is
explicitly requested**.
- **Like button**: Backend + API + localStorage deduplication done; heart fills and disables after first like per browser
- **Edit/delete products**: Edit modal done (May 2026); delete not yet implemented
- **Customer management / CRM**: Link sales to customer profiles, view purchase history
- **Export to CSV**: Download sales and expense data for accounting
- **Google OAuth admin login**: ✅ Implemented June 2026 — remove legacy password fallback after verified stable
- **Inventory alerts**: Low-stock notifications (push or email) when stock drops below a threshold
- **Discount / promo codes**: Apply percentage or flat discounts at checkout for future e-commerce mode
- **Order management**: Cart → checkout → order tracking when direct purchase is enabled
- **Per-product cost price**: Removed (May 2026) for security — cost data must not appear on the wire. P&L tracked at invoice level via Expenses tab. Future re-introduction must be server-side only, never returned by any endpoint.

Remember: This is a jewelry e-commerce platform focusing on user experience, mobile responsiveness, and beautiful product presentation. Always consider the business context when making technical suggestions.