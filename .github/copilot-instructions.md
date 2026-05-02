# GitHub Copilot Instructions

## Project Context
You are working on **Dhanak Trinket**, an e-commerce platform for ethnic finds including bangles, necklaces, imitation jewelry, and future expansion to ethnic wear built with .NET Core backend and Next.js frontend.

## Key Information
- **Tech Stack**: ASP.NET Core 8.0 Web API + Next.js 14+ with TypeScript
- **Database**: Azure SQL Database + Azure Blob Storage for images  
- **Cloud**: Azure ecosystem (App Service, Static Web Apps, CDN)
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

Remember: This is a jewelry e-commerce platform focusing on user experience, mobile responsiveness, and beautiful product presentation. Always consider the business context when making technical suggestions.