# Azure Resources Setup Guide - Dhanak Trinket

## 🚀 Azure Resources Required for Dhanak Trinket

### **Step 1: Create Resource Group**
```bash
# Login to Azure CLI
az login

# Create Resource Group
az group create --name "rg-dhanak-trinket-prod" --location "Central India"
```

### **Step 2: Azure SQL Database**
```bash
# Create SQL Server
az sql server create \
  --name "sql-dhanak-trinket-prod" \
  --resource-group "rg-dhanak-trinket-prod" \
  --location "Central India" \
  --admin-user "dhanakadmin" \
  --admin-password "YourSecurePassword123!"

# Create SQL Database
az sql db create \
  --resource-group "rg-dhanak-trinket-prod" \
  --server "sql-dhanak-trinket-prod" \
  --name "db-dhanak-trinket" \
  --service-objective Basic
```

**Manual Step:** Configure firewall rules in Azure Portal to allow your IP

### **Step 3: Azure Blob Storage (Product Images)**
```bash
# Create Storage Account
az storage account create \
  --name "stdhanak2026prod" \
  --resource-group "rg-dhanak-trinket-prod" \
  --location "Central India" \
  --sku Standard_LRS

# Create container for product images
az storage container create \
  --name "product-images" \
  --account-name "stdhanak2026prod" \
  --public-access blob
```

### **Step 4: Azure App Service (Backend API)**
```bash
# Create App Service Plan
az appservice plan create \
  --name "asp-dhanak-trinket" \
  --resource-group "rg-dhanak-trinket-prod" \
  --location "Central India" \
  --sku B1

# Create Web App
az webapp create \
  --resource-group "rg-dhanak-trinket-prod" \
  --plan "asp-dhanak-trinket" \
  --name "api-dhanak-trinket-2026" \
  --runtime "DOTNET:8.0"
```

### **Step 5: Azure Static Web Apps (Frontend)**
```bash
# Note: This is typically done through GitHub integration
# You'll connect this during deployment
```

### **Step 6: Application Insights (Monitoring)**
```bash
az monitor app-insights component create \
  --app "ai-dhanak-trinket" \
  --location "Central India" \
  --resource-group "rg-dhanak-trinket-prod"
```

## 📝 Connection Strings to Collect

After creating resources, collect these connection strings:

### **1. SQL Database Connection String**
```
Server=tcp:sql-dhanak-trinket-prod.database.windows.net,1433;Initial Catalog=db-dhanak-trinket;Persist Security Info=False;User ID=dhanakadmin;Password=YourSecurePassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### **2. Blob Storage Connection String**
Go to Storage Account → Access Keys → Copy connection string

### **3. Application Insights Key**
Go to Application Insights → Properties → Copy Instrumentation Key

## 🔐 Key Vault Setup (Recommended)
```bash
# Create Key Vault
az keyvault create \
  --name "kv-dhanak-trinket" \
  --resource-group "rg-dhanak-trinket-prod" \
  --location "Central India"

# Add secrets
az keyvault secret set --vault-name "kv-dhanak-trinket" --name "SqlConnectionString" --value "YourConnectionString"
az keyvault secret set --vault-name "kv-dhanak-trinket" --name "BlobStorageConnectionString" --value "YourBlobConnectionString"
```

## 💰 Cost Estimation (Monthly)
- **SQL Database (Basic)**: ~₹400-500
- **App Service (B1)**: ~₹1,000-1,200  
- **Storage Account**: ~₹100-200
- **Static Web Apps**: Free tier (sufficient initially)
- **Application Insights**: Free tier (5GB/month)

**Total Monthly Cost**: ~₹1,500-2,000 ($18-24)

## ⚙️ Configuration for Local Development

Create `appsettings.Development.json` in your API project:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YourSqlConnectionString",
    "BlobStorage": "YourBlobStorageConnectionString"
  },
  "ApplicationInsights": {
    "InstrumentationKey": "YourApplicationInsightsKey"
  },
  "AllowedOrigins": [
    "http://localhost:3000",
    "https://localhost:3000"
  ]
}
```

## ✅ Verification Checklist
- [ ] Resource group created
- [ ] SQL Server and Database running
- [ ] Storage account created with container
- [ ] App Service plan and web app created  
- [ ] Application Insights configured
- [ ] Key Vault created (optional but recommended)
- [ ] Connection strings collected
- [ ] Firewall rules configured for SQL Database

## 🔄 Next Steps After Resources Are Ready
1. Update connection strings in your .NET application
2. Run Entity Framework migrations to create database schema
3. Deploy backend API to App Service
4. Deploy frontend to Static Web Apps
5. Test end-to-end functionality

---

*Keep this document handy during development. Update connection strings in your code once Azure resources are created.*

**Estimated Setup Time**: 30-45 minutes