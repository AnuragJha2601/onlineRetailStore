# AI Assistant Instructions - Dhanak Trinket E-commerce Platform

## Quick Context
This is Dhanak Trinket - an ethnic finds e-commerce platform (bangles, necklaces, imitation jewelry, future ethnic wear) built with .NET Core + Next.js + Azure.

## Key Files to Reference
- **Technical Specs**: `/docs/TECHNICAL_ARCHITECTURE.md`
- **Full Context**: `/docs/DEVELOPMENT_CONTEXT.md` 
- **Current Tasks**: `/docs/OPEN_ISSUES.md`
- **GitHub Copilot**: `.github/copilot-instructions.md`

## Project Structure
```
├── backend/           # ASP.NET Core Web API
├── frontend/          # Next.js with TypeScript
├── docs/             # Technical documentation
├── .github/          # GitHub workflows & instructions
└── .ai/              # AI-specific instructions
```

## Development Priorities
1. **Operational dashboard** (live): Inventory, Expenses, Sales tabs in admin
2. **P&L dashboard**: Monthly revenue vs expenses chart/table
3. **Edit/delete products**: Admin panel gap
4. **Product detail page**: Catalog item click-through
5. **E-commerce**: Cart, checkout, Razorpay/Stripe (Phase 2)

## Technology Choices Made
- **Backend**: .NET Core 9.0 (owner is C# expert)
- **Frontend**: Next.js 16 (static export, SEO, image optimization)
- **Database**: Azure SQL (EF Core code-first; SQLite for local dev)
- **Cloud**: Azure ecosystem (App Service, Static Web Apps, Blob Storage)
- **Auth**: JWT Bearer, BCrypt.Net-Next, single `dhanakadmin` admin user

## Business Context
- **Owner**: Running jewelry retail business
- **Products**: Wholesale bangles, necklaces, imitation jewelry
- **Target**: Mobile-first Indian market
- **Current**: Live in production — catalog + admin operations dashboard
- **Future**: Full e-commerce with payment integration

## Code Standards
- **C#**: Clean Architecture, async/await, FluentValidation, Repository pattern
- **React**: TypeScript strict mode, functional components, Tailwind CSS
- **Database**: Entity Framework Core, code-first migrations, audit fields
- **API**: RESTful design, standardized responses, proper HTTP codes

## Key Reminders
- This is a **public GitHub repository** - maintain professional standards
- **Mobile-first design** - 70% expected mobile traffic
- **Image optimization** critical for jewelry photos
- **SEO optimization** important for product discovery
- **Scalable architecture** designed for business growth

## AI Assistance Guidelines
1. Always check `/docs/OPEN_ISSUES.md` for current priorities
2. Reference full context from `/docs/DEVELOPMENT_CONTEXT.md`
3. Follow coding standards from GitHub Copilot instructions
4. Consider mobile experience in all UI suggestions
5. Keep future e-commerce integration in mind
6. Update documentation when resolving issues or adding features

## Common Tasks
- Setting up Azure resources and configurations
- Building product catalog UI with Next.js
- Creating REST APIs for products, categories, search
- Database design and Entity Framework setup  
- Image handling and optimization
- Mobile-responsive component development
- SEO optimization and performance tuning