# Phase 8.1: Azure Infrastructure Setup Guide

**Date:** March 8, 2026  
**Issue:** [#62](https://github.com/richardthorek/CCS-Calculator/issues/62)  
**Status:** In Progress

## Environment Details

**Existing Azure Resources:**
- **Subscription:** Experimentation and Learning
- **Subscription ID:** `67fb0ac0-a5bf-4906-bf1f-5756416dc98b`
- **Resource Group:** `ccs-calculator` (already exists)
- **Location:** Global (Static Web App)
- **Current SWA:** `yellow-cliff-03142c500.4.azurestaticapps.net`

## Setup Steps

### 1. Azure CLI Login

```bash
az login
az account set --subscription "67fb0ac0-a5bf-4906-bf1f-5756416dc98b"
az account show
```

### 2. Create Storage Account

We'll use the existing resource group `ccs-calculator` and create a new storage account:

```bash
# Set variables
RESOURCE_GROUP="ccs-calculator"
LOCATION="australiaeast"  # Or match your SWA region
STORAGE_ACCOUNT="stccscalc$(openssl rand -hex 4)"  # Generates unique name
STORAGE_SKU="Standard_LRS"

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku $STORAGE_SKU \
  --kind StorageV2 \
  --access-tier Hot \
  --https-only true \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false

# Get connection string
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv)

echo "Storage Account: $STORAGE_ACCOUNT"
echo "Connection String: $STORAGE_CONNECTION_STRING"
```

**Save these values securely!**

### 3. Create Table Storage Tables

```bash
# Create userscenarios table
az storage table create \
  --name userscenarios \
  --connection-string "$STORAGE_CONNECTION_STRING"

# Create userprofiles table
az storage table create \
  --name userprofiles \
  --connection-string "$STORAGE_CONNECTION_STRING"

# Verify tables created
az storage table list \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --output table
```

### 4. Register OAuth Providers

#### Google OAuth
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: Web application
4. Name: CCS Calculator
5. Authorized redirect URIs:
   ```
   https://yellow-cliff-03142c500.4.azurestaticapps.net/.auth/login/google/callback
   ```
6. Save **Client ID** and **Client Secret**

#### Microsoft OAuth (Azure AD)
1. Go to: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
2. Click "New registration"
3. Name: CCS Calculator
4. Supported account types: Accounts in any organizational directory and personal Microsoft accounts
5. Redirect URI: Web → 
   ```
   https://yellow-cliff-03142c500.4.azurestaticapps.net/.auth/login/aad/callback
   ```
6. After registration, go to "Certificates & secrets" → "New client secret"
7. Save **Application (client) ID** and **Client Secret**

#### GitHub OAuth
1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Application name: CCS Calculator
4. Homepage URL: `https://yellow-cliff-03142c500.4.azurestaticapps.net`
5. Authorization callback URL:
   ```
   https://yellow-cliff-03142c500.4.azurestaticapps.net/.auth/login/github/callback
   ```
6. Save **Client ID** and **Client Secret**

### 5. Add Azure Static Web App Settings

Get your Static Web App name:
```bash
az staticwebapp list --resource-group $RESOURCE_GROUP --query "[].name" -o tsv
```

Add app settings:
```bash
SWA_NAME="<your-swa-name>"  # From previous command

az staticwebapp appsettings set \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names \
    AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION_STRING" \
    TABLE_NAME_SCENARIOS="userscenarios" \
    TABLE_NAME_PROFILES="userprofiles"

# Verify settings
az staticwebapp appsettings list \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --output table
```

### 6. Add GitHub Repository Secrets

1. Go to: https://github.com/richardthorek/CCS-Calculator/settings/secrets/actions
2. Add these secrets:
   - **AZURE_STORAGE_CONNECTION_STRING**: (from step 2)
   - **AZURE_STATIC_WEB_APPS_API_TOKEN**: (get from Azure portal → Static Web App → Manage deployment token)

Or via GitHub CLI:
```bash
gh secret set AZURE_STORAGE_CONNECTION_STRING --body "$STORAGE_CONNECTION_STRING" --repo richardthorek/CCS-Calculator

# Get SWA deployment token from Azure
SWA_TOKEN=$(az staticwebapp secrets list \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.apiKey \
  --output tsv)

gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$SWA_TOKEN" --repo richardthorek/CCS-Calculator
```

### 7. Document Resources Created

Update this section with actual values after completion:

```
Date Completed: _____________
Storage Account: _____________
Connection String: [SAVED SECURELY]
Location: _____________

OAuth Providers:
- Google Client ID: _____________
- Microsoft Client ID: _____________
- GitHub Client ID: _____________

GitHub Secrets Added: ✅ / ❌
Azure App Settings Added: ✅ / ❌
Tables Created: ✅ / ❌
```

## Verification Steps

1. **Verify Storage Account:**
   ```bash
   az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP
   ```

2. **Verify Tables:**
   ```bash
   az storage table list --connection-string "$STORAGE_CONNECTION_STRING" --output table
   ```

3. **Verify App Settings:**
   ```bash
   az staticwebapp appsettings list --name $SWA_NAME --resource-group $RESOURCE_GROUP
   ```

4. **Verify GitHub Secrets:**
   ```bash
   gh secret list --repo richardthorek/CCS-Calculator
   ```

## Troubleshooting

### Storage Account Name Already Taken
If the generated name is taken, manually set a different one:
```bash
STORAGE_ACCOUNT="stccscalcYYYYMMDD"  # Use today's date or other unique suffix
```

### Connection String Issues
Ensure the connection string includes all components:
```bash
echo $STORAGE_CONNECTION_STRING | grep "AccountName" | grep "AccountKey"
```

### OAuth Redirect URI Issues
- Ensure redirect URIs match exactly (including protocol and no trailing slash)
- Double-check your Static Web App URL
- Test auth flow after adding URIs

## References

- [Azure Table Storage Documentation](https://learn.microsoft.com/en-us/azure/storage/tables/)
- [Azure Static Web Apps Authentication](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization)
- [OAuth 2.0 Authorization Flow](https://oauth.net/2/)

---

**Next Steps:** After completion, proceed to Phase 8.2 (Backend API Development)
