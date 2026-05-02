# 🚀 Azure Manual Deployment Guide
## ✅ GOOD NEWS: Your App is Already Configured!

Since your `appsettings.Production.json` already contains all the connection strings and settings, **you can skip Steps 1-2** and jump directly to **Step 3: Deploy Backend API**.

The configuration steps below are only needed if you want to use Azure's configuration instead of your appsettings file.
## � SECURITY FIRST!
**⚠️ CRITICAL**: Before deployment, read the [SECURITY_GUIDE.md](SECURITY_GUIDE.md) to properly configure secrets in Azure App Service instead of config files.

## �📋 Pre-Deployment Checklist

Based on your created Azure resources:
- ✅ **SQL Server**: `sql-dhanak-trinket-prod.database.windows.net`
- ✅ **Database**: `db-dhanak-trinket`
- ✅ **App Service**: `api-dhanak-trinket-2026.azurewebsites.net`
- ✅ **Storage Account**: `stdhanak2026prod`
- ✅ **Application Insights**: `ai-dhanak-trinket`

## 🔧 Step 1: Configure Azure App Service Settings (Simple Steps)

**What This Does**: Instead of hardcoding secrets in your code, Azure App Service lets you store them securely in the cloud. Your app reads these values automatically.

### Option A: Skip This Step (Easiest)
Since your `appsettings.Production.json` already has all the connection strings, you can **skip this step** and deploy directly. Your app will work fine!

### Option B: Use Azure Configuration (More Secure)
If you want to use Azure's secure configuration:

**Step 1.1: Open Your App Service**
1. Go to **portal.azure.com**
2. Search for "App Services" 
3. Click on `api-dhanak-trinket-2026`

**Step 1.2: Go to Configuration**
1. In the left menu, click **"Settings"**
2. Click **"Configuration"**
3. You'll see tabs: "Application settings" and "Connection strings"

**Step 1.3: Add Connection Strings** (Only if you want to override appsettings.json)
Click **"Connection strings"** tab, then **"+ New connection string"**:

**For Database** (Already configured via Azure AD, so optional):
- Name: `DefaultConnection`
- Value: `Server=sql-dhanak-trinket-prod.database.windows.net;Database=db-dhanak-trinket;Authentication=Active Directory Default;Encrypt=True;`
- Type: `SQLAzure`

**For Storage** (Only if you want to override your appsettings):
- Name: `BlobStorage` 
- Value: `DefaultEndpointsProtocol=https;AccountName=stdhanak2026prod;AccountKey=[YOUR_STORAGE_KEY];EndpointSuffix=core.windows.net`
- Type: `Custom`

**Step 1.4: Save**
- Click **"Save"** at the top
- Click **"Continue"** when it asks about restarting

## 🔧 Step 2: Configure Application Settings (Optional)

**What This Does**: Sets environment variables that your app can read.

Since your `appsettings.Production.json` is already configured, **you can skip this step** too!

**If you want to add these anyway:**

**Step 2.1: Application Settings Tab**
In the same Configuration page, click **"Application settings"** tab

**Step 2.2: Add These (Optional)**
Click **"+ New application setting"**:

```
ASPNETCORE_ENVIRONMENT = Production
APPLICATIONINSIGHTS_CONNECTION_STRING = InstrumentationKey=fc4e37fc-b868-45eb-afa6-612f600abcbf
AllowedOrigins__0 = https://[your-static-web-app-url].azurestaticapps.net
```

**Step 2.3: Save**
Click **"Save"** → **"Continue"**

## 🚀 Step 3: Deploy Backend API (Main Step)

**This is the main step you need to do!**

### Option A: Visual Studio Publish (Easiest)
1. **Open Visual Studio**
2. **Right-click** on `DhanakTrinket.Api` project in Solution Explorer
3. **Click "Publish"**
4. **Select "Azure"** → **"Azure App Service (Windows)"**
5. **Choose your subscription** and select `api-dhanak-trinket-2026`
6. **Click "Publish"** - Visual Studio will build and deploy everything!

### Option B: Command Line Publish
```bash
# Navigate to your project
cd C:\Users\anuragjha\wPersonal\WebSites_Personal\onlineRetailStore\backend

# Build and publish (creates a publish folder)
dotnet publish DhanakTrinket.Api -c Release -o ./publish

# The files in ./publish folder need to be uploaded to Azure
# You can zip them and upload via Azure Portal → App Service → Deployment Center
```

### Option C: Azure CLI (If you have it installed)
```bash
# Build and publish
cd backend
dotnet publish DhanakTrinket.Api -c Release -o ./publish

# Create zip file
Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip

# Deploy to Azure (requires Azure CLI)
az webapp deployment source config-zip \
  --resource-group rg-dhanak-trinket-prod \
  --name api-dhanak-trinket-2026 \
  --src ./publish.zip
```

## 📊 Step 4: Initialize Database

1. **Enable Database Migrations** in Azure:
   ```bash
   # Run this after first deployment
   # The app will auto-create tables on first run
   ```

2. **Test Database Connection**:
   - Go to: `https://api-dhanak-trinket-2026.azurewebsites.net/api/products`
   - Should return empty array `[]`

## 🌐 Step 5: Deploy Frontend (Azure Static Web Apps)

### Create Static Web App Resource:
1. **Azure Portal** → Create Resource → **Static Web Apps**
2. **Name**: `dhanak-trinket-frontend`
3. **Region**: Same as your other resources
4. **GitHub Integration**: Connect your repository
5. **Build Presets**: Next.js
6. **App location**: `/frontend/dhanak-trinket-frontend`
7. **Output location**: `out`

### Configure Frontend Environment:
1. **Static Web Apps** → Configuration → Environment Variables
2. **Add**:
   ```
   NEXT_PUBLIC_API_BASE_URL = https://api-dhanak-trinket-2026.azurewebsites.net/api
   ```

## 🔒 Step 6: Configure SQL Database Access

### Option A: Enable Azure Active Directory Authentication
```sql
-- Run in Azure SQL Database Query Editor
-- No additional user creation needed for Managed Identity
```

### Option B: Use SQL Authentication (Alternative)
1. **Create SQL User** in database:
   ```sql
   CREATE LOGIN [api-dhanak-trinket-2026] WITH PASSWORD = 'YourStrongPassword123!';
   CREATE USER [api-dhanak-trinket-2026] FROM LOGIN [api-dhanak-trinket-2026];
   ALTER ROLE db_owner ADD MEMBER [api-dhanak-trinket-2026];
   ```

2. **Update Connection String** in App Service:
   ```
   Server=sql-dhanak-trinket-prod.database.windows.net;Database=db-dhanak-trinket;User ID=api-dhanak-trinket-2026;Password=YourStrongPassword123!;Encrypt=True;
   ```

## ✅ Step 7: Test Deployment

### Backend API Tests:
```bash
# Test API endpoints
curl https://api-dhanak-trinket-2026.azurewebsites.net/api/products
curl https://api-dhanak-trinket-2026.azurewebsites.net/api/products/categories
```

### Frontend Tests:
1. Visit your Static Web App URL
2. Test navigation between pages
3. Test product catalog loading
4. Test admin panel functionality

## 🔧 Step 8: Enable CORS for Frontend

**App Service** → Settings → CORS:
- Add your Static Web App URL: `https://[your-app].azurestaticapps.net`
- Enable **Access-Control-Allow-Credentials** if needed

## 📝 Step 9: Set up Monitoring

### Application Insights (Already configured):
- **Performance**: Monitor API response times
- **Failures**: Track errors and exceptions
- **Usage**: Monitor user behavior

### Log Stream:
- **App Service** → Monitoring → Log stream
- Monitor real-time application logs

## 🎯 Next Steps After Deployment

1. **Test end-to-end functionality**
2. **Add sample products** through admin panel
3. **Configure custom domain** (optional)
4. **Set up backup strategies**
5. **Configure monitoring alerts**

---

## 🚨 Troubleshooting Common Issues

### Database Connection Issues:
- Check firewall settings on SQL Server
- Verify connection string format
- Ensure Managed Identity is enabled

### CORS Issues:
- Add frontend URL to CORS settings
- Check AllowedOrigins in appsettings.Production.json

### Storage Account Issues:
- Verify storage account key is correct
- Check container permissions for blob storage

---

Ready to start deploying? Let me know which step you'd like to tackle first! 🚀