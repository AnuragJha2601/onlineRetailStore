# Dhanak Trinket - Frontend Development Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn installed
- Backend API running on `http://localhost:5000` (see backend setup guide)
- Azure resources created (see AZURE_SETUP_GUIDE.md)

### Installation & Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd frontend/dhanak-trinket-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment**
   Create `.env.local` file in the frontend root:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open Application**
   - Customer Catalog: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## 📱 Features Overview

### Customer Catalog (/)
- **Product Grid**: Responsive grid layout showing all products
- **Search & Filter**: Search by name/description, filter by category
- **Stock Status**: Shows "Sold Out" badge for out-of-stock items
- **Like System**: Heart button to like products (updates count)
- **Mobile Responsive**: Optimized for mobile and desktop viewing

### Admin Panel (/admin)
- **Product Upload**: Complete form with validation
- **Image Management**: Multi-image upload with preview and removal
- **Category Selection**: Dropdown with all jewelry categories
- **Stock Management**: Set quantity and availability status
- **Success/Error Feedback**: Toast notifications for user actions

## 🛠 Component Architecture

### Core Components
- `ProductCatalog.tsx` - Customer-facing product grid with filtering
- `ProductUploadForm.tsx` - Admin form for creating products
- `ProductCard.tsx` - Individual product display component

### Services
- `productApi.ts` - API communication layer
- Type definitions in `types/product.ts`

## 🧪 Testing Your Setup

### 1. Test Backend Connection
1. Start your backend API server
2. Open browser developer tools (F12)
3. Navigate to http://localhost:3000
4. Check Console for any API errors

### 2. Test Admin Product Upload
1. Go to http://localhost:3000/admin
2. Fill out the product form:
   - Name: "Test Gold Bangles"
   - Category: Select any category
   - Price: 299
   - Upload 1-2 test images
3. Click "Create Product"
4. Should see success message

### 3. Test Customer View
1. Go to http://localhost:3000
2. Should see the product you just created
3. Try the search and filter functionality
4. Click the heart ❤️ to test the like feature

## 🎨 UI/UX Features

### Design System
- **Colors**: Indigo primary (#4F46E5), gray neutrals
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent padding and margins
- **Shadows**: Subtle elevation for cards

### Mobile Optimization
- Responsive grid: 1 column mobile, 2-4 columns desktop
- Touch-friendly buttons and interactive elements
- Optimized image loading and sizing

### User Experience
- Loading states with spinners
- Error handling with user-friendly messages
- Form validation with helpful feedback
- Image previews before upload

## 🔧 Customization

### Adding New Categories
1. Update `ProductCategory` enum in `types/product.ts`
2. Update backend enum to match
3. Components will automatically reflect changes

### Styling Changes
- Modify Tailwind classes in components
- Update `tailwind.config.js` for theme changes
- Add custom CSS in `globals.css` if needed

### API Configuration
- Update `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Modify `productApi.ts` for additional endpoints

## 🐛 Common Issues

### API Connection Errors
- Ensure backend is running on port 5000
- Check CORS configuration in backend
- Verify environment variable in `.env.local`

### Image Upload Issues
- Check file size (5MB limit)
- Ensure backend blob storage is configured
- Verify image file types (JPEG, PNG, WebP)

### Build Issues
- Run `npm run build` to check for TypeScript errors
- Ensure all imports and types are correct
- Check console for detailed error messages

## 📦 Deployment Preparation

### For Azure Static Web Apps
1. Build the application: `npm run build`
2. The `out` folder will contain static files
3. Configure Azure Static Web Apps to use this folder
4. Set production API URL in environment variables

### Environment Variables
Production `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-app.azurewebsites.net/api
```

---

## 🎯 Next Steps

1. **Test Complete Flow**: Admin upload → Customer view → Like product
2. **Upload Sample Products**: Add 5-10 products with real images
3. **Deploy to Azure**: Follow Azure Static Web Apps deployment guide
4. **Performance Testing**: Test image loading and responsiveness
5. **User Testing**: Have family members test the admin and catalog features

## 💡 Tips for Success

- **High-Quality Images**: Use good lighting and multiple angles
- **Descriptive Names**: Include material and style in product names
- **Proper Categories**: Choose the most appropriate jewelry category
- **Stock Management**: Keep quantities updated to avoid overselling
- **Regular Testing**: Test both admin and customer experiences regularly

Happy developing! 🚀