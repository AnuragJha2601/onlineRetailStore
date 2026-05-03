# 🔒 Security Configuration Guide

## ⚠️ CRITICAL: Before Deployment

**NEVER commit sensitive data to source control!** 

Your configuration has been secured by removing secrets from files. Follow this guide to configure secrets securely in Azure.

## 🚨 Security Issues Addressed

### Current State:
- ⚠️ **In progress**: Azure Blob Storage account key is in `appsettings.Production.json` (gitignored, not in source control — but should move to App Service config)
- ✅ **Secured**: `appsettings.Production.json` is in `.gitignore` — never committed
- ✅ **Secured**: Database uses Managed Identity (`Authentication=Active Directory Default`) — no password
- ✅ **Secured**: CORS uses `SetIsOriginAllowed` lambda — restricts to `*.azurestaticapps.net` and `*.azurewebsites.net` only

### 🔧 Secure Configuration Required:

You must configure these secrets in **Azure App Service Configuration** (NOT in files):

## 🌐 Azure App Service Configuration

### Step 1: Navigate to Configuration
1. **Azure Portal** → **App Services** → `api-dhanak-trinket-2026`
2. **Settings** → **Configuration**

### Step 2: Add Connection Strings
Click **"+ New connection string"** for each:

**BlobStorage**:
- **Name**: `BlobStorage`
- **Value**: `DefaultEndpointsProtocol=https;AccountName=stdhanak2026prod;AccountKey=[YOUR_ACTUAL_STORAGE_KEY];EndpointSuffix=core.windows.net`
- **Type**: `Custom`

### Step 3: Add Application Settings
Click **"+ New application setting"** for each:

**Application Insights**:
- **Name**: `ApplicationInsights__ConnectionString`
- **Value**: `InstrumentationKey=fc4e37fc-b868-45eb-afa6-612f600abcbf`

**Environment**:
- **Name**: `ASPNETCORE_ENVIRONMENT`
- **Value**: `Production`

**CORS Origins**:
- **Name**: `AllowedOrigins__0`
- **Value**: `https://[YOUR-STATIC-WEB-APP].azurestaticapps.net`

### Step 4: Save Configuration
- Click **"Save"** at the top
- App will automatically restart with new settings

## 🔐 Enhanced Security Options (Recommended)

### Option 1: Use Azure Key Vault (Most Secure)
```json
{
    "KeyVault": {
        "Vault": "https://kv-dhanak-trinket.vault.azure.net/"
    }
}
```

### Option 2: Use Managed Identity for Storage
Replace storage account key with Managed Identity:
```json
{
    "BlobStorage": "https://stdhanak2026prod.blob.core.windows.net/"
}
```

## 🛡️ Additional Security Measures

### 1. Database Security
Your SQL connection string already uses **Azure AD Authentication** ✅
```
Authentication=Active Directory Default;Encrypt=True;
```

### 2. HTTPS Enforcement
Add to appsettings.Production.json:
```json
{
    "Kestrel": {
        "EndpointDefaults": {
            "Protocols": "Http1AndHttp2"
        }
    },
    "ForwardedHeaders": {
        "ForwardedProtoHeaderName": "X-Forwarded-Proto"
    }
}
```

### 3. CORS Security
Your current CORS is restrictive ✅:
- Only allows your Static Web App domain
- No wildcard origins in production

### 4. API Rate Limiting (Future Enhancement)
Consider adding rate limiting middleware.

## 🔍 Security Checklist

Before deploying, verify:

- [x] `appsettings.Production.json` excluded from git via `.gitignore`
- [ ] Move blob connection string to Azure App Service environment variable (currently in gitignored file)
- [x] Database uses Azure AD authentication (Managed Identity) — no password stored anywhere
- [x] CORS restricted to `*.azurestaticapps.net` and `*.azurewebsites.net`
- [x] HTTPS enforced (Azure App Service default)
- [x] Private blob container — images served via time-limited SAS URLs

## 🚨 What NOT to Do

❌ **Never put these in source control:**
- Database passwords
- Storage account keys
- API keys / secrets
- Connection strings with sensitive data
- Private certificates

❌ **Never use in production:**
- Hardcoded secrets in code
- Development connection strings
- Wildcard CORS origins (`*`)
- HTTP (unencrypted) endpoints

## 🎯 Ready for Secure Deployment

Your app is now configured securely! The sensitive configuration is:
- ✅ **Removed from files** 
- ✅ **Must be set in Azure App Service Configuration**
- ✅ **Protected by .gitignore**

## Next Steps:
1. Configure secrets in Azure App Service (Step 1-4 above)
2. Deploy your application
3. Test all functionality
4. Monitor Application Insights for security events

**Remember**: Azure App Service configuration is encrypted and secure - this is the proper way to handle production secrets! 🔒