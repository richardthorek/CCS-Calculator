#!/bin/bash
#
# Azure Infrastructure Setup Script for CCS Calculator
# Provisions all required Azure resources for authentication and storage
#
# Prerequisites:
# - Azure CLI installed (az command)
# - Active Azure subscription
# - Appropriate permissions to create resources
#
# Usage:
#   chmod +x setup-azure-auth-storage.sh
#   ./setup-azure-auth-storage.sh
#

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════╗"
echo "║  CCS Calculator - Azure Infrastructure Setup           ║"
echo "║  Authentication + Table Storage                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# CONFIGURATION
# ============================================================================

RESOURCE_GROUP="rg-ccs-calculator"
LOCATION="australiaeast"  # Change to your preferred Azure region
STORAGE_ACCOUNT="stccscalc$(openssl rand -hex 4)"
STORAGE_SKU="Standard_LRS"  # Locally-redundant storage (cheapest)
SWA_NAME="swa-ccs-calculator"
GITHUB_REPO="https://github.com/richardthorek/CCS-Calculator"
GITHUB_BRANCH="main"

echo "📋 Configuration:"
echo "  Resource Group:    $RESOURCE_GROUP"
echo "  Location:          $LOCATION"
echo "  Storage Account:   $STORAGE_ACCOUNT (with random suffix)"
echo "  Storage SKU:       $STORAGE_SKU"
echo "  Static Web App:    $SWA_NAME"
echo ""

# Prompt for confirmation
read -p "Proceed with this configuration? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# ============================================================================
# PREREQUISITES CHECK
# ============================================================================

echo ""
echo "🔍 Checking prerequisites..."

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found."
    echo ""
    echo "Please install Azure CLI:"
    echo "  macOS:   brew install azure-cli"
    echo "  Ubuntu:  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    echo "  Windows: https://aka.ms/installazurecliwindows"
    exit 1
fi

echo "✅ Azure CLI found: $(az version --query '\"azure-cli\"' -o tsv)"

# Check OpenSSL (for random string generation)
if ! command -v openssl &> /dev/null; then
    echo "⚠️  OpenSSL not found. Using timestamp for storage account suffix."
    STORAGE_ACCOUNT="stccscalc$(date +%s)"
fi

# Login check
echo ""
echo "🔐 Checking Azure login..."
if ! az account show &> /dev/null; then
    echo "Not logged in. Initiating login..."
    az login
else
    echo "Already logged in."
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
echo "✅ Using subscription:"
echo "   ID:   $SUBSCRIPTION_ID"
echo "   Name: $SUBSCRIPTION_NAME"

# Confirm subscription
read -p "Is this the correct subscription? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the correct subscription:"
    echo "  az account set --subscription <subscription-id>"
    exit 1
fi

# ============================================================================
# RESOURCE GROUP
# ============================================================================

echo ""
echo "📦 Creating resource group..."
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "⚠️  Resource group '$RESOURCE_GROUP' already exists."
    read -p "Continue using existing resource group? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
else
    az group create \
      --name $RESOURCE_GROUP \
      --location $LOCATION \
      --output none
    
    echo "✅ Resource group created: $RESOURCE_GROUP"
fi

# ============================================================================
# STORAGE ACCOUNT
# ============================================================================

echo ""
echo "💾 Creating storage account..."
echo "   Name: $STORAGE_ACCOUNT"

if az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "⚠️  Storage account '$STORAGE_ACCOUNT' already exists."
    read -p "Continue using existing storage account? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
else
    az storage account create \
      --name $STORAGE_ACCOUNT \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --sku $STORAGE_SKU \
      --kind StorageV2 \
      --access-tier Hot \
      --https-only true \
      --min-tls-version TLS1_2 \
      --allow-blob-public-access false \
      --output none
    
    echo "✅ Storage account created: $STORAGE_ACCOUNT"
fi

# Get connection string
echo ""
echo "🔗 Retrieving storage connection string..."
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv)

if [ -z "$STORAGE_CONNECTION_STRING" ]; then
    echo "❌ Failed to retrieve connection string."
    exit 1
fi

echo "✅ Connection string retrieved"

# ============================================================================
# TABLE STORAGE TABLES
# ============================================================================

echo ""
echo "📊 Creating Table Storage tables..."

# Create userscenarios table
if az storage table exists \
    --name userscenarios \
    --connection-string "$STORAGE_CONNECTION_STRING" \
    --query exists -o tsv | grep -q "true"; then
    echo "⚠️  Table 'userscenarios' already exists."
else
    az storage table create \
      --name userscenarios \
      --connection-string "$STORAGE_CONNECTION_STRING" \
      --output none
    echo "✅ Table 'userscenarios' created"
fi

# Create userprofiles table
if az storage table exists \
    --name userprofiles \
    --connection-string "$STORAGE_CONNECTION_STRING" \
    --query exists -o tsv | grep -q "true"; then
    echo "⚠️  Table 'userprofiles' already exists."
else
    az storage table create \
      --name userprofiles \
      --connection-string "$STORAGE_CONNECTION_STRING" \
      --output none
    echo "✅ Table 'userprofiles' created"
fi

# Verify tables
echo ""
echo "📋 Verifying tables..."
az storage table list \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --output table

# ============================================================================
# STATIC WEB APP (OPTIONAL)
# ============================================================================

echo ""
read -p "🌐 Create/update Azure Static Web App? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating/updating Static Web App..."
    echo "   Name: $SWA_NAME"
    
    if az staticwebapp show --name $SWA_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        echo "⚠️  Static Web App '$SWA_NAME' already exists."
        
        # Update app settings
        echo "Updating application settings..."
        az staticwebapp appsettings set \
          --name $SWA_NAME \
          --resource-group $RESOURCE_GROUP \
          --setting-names \
            AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION_STRING" \
            TABLE_NAME_SCENARIOS="userscenarios" \
            TABLE_NAME_PROFILES="userprofiles" \
          --output none
        
        echo "✅ Application settings updated"
    else
        echo "⚠️  Static Web App creation requires GitHub authentication."
        echo "Please create manually or run:"
        echo ""
        echo "az staticwebapp create \\"
        echo "  --name $SWA_NAME \\"
        echo "  --resource-group $RESOURCE_GROUP \\"
        echo "  --location $LOCATION \\"
        echo "  --source $GITHUB_REPO \\"
        echo "  --branch $GITHUB_BRANCH \\"
        echo "  --app-location \"/src\" \\"
        echo "  --api-location \"/api\" \\"
        echo "  --login-with-github"
        echo ""
        echo "Then add app settings:"
        echo "az staticwebapp appsettings set \\"
        echo "  --name $SWA_NAME \\"
        echo "  --resource-group $RESOURCE_GROUP \\"
        echo "  --setting-names \\"
        echo "    AZURE_STORAGE_CONNECTION_STRING='$STORAGE_CONNECTION_STRING'"
    fi
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  SETUP COMPLETE ✅                                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Resource Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Subscription:      $SUBSCRIPTION_NAME"
echo "Resource Group:    $RESOURCE_GROUP"
echo "Location:          $LOCATION"
echo "Storage Account:   $STORAGE_ACCOUNT"
echo "Tables Created:    userscenarios, userprofiles"
echo ""
echo "🔐 Connection String (KEEP SECURE):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$STORAGE_CONNECTION_STRING"
echo ""
echo "📝 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Save connection string to GitHub Secrets:"
echo "   Go to: $GITHUB_REPO/settings/secrets/actions"
echo "   Add secret: AZURE_STORAGE_CONNECTION_STRING"
echo "   Value: (use connection string above)"
echo ""
echo "2. If you have an existing Static Web App, update settings:"
echo "   az staticwebapp appsettings set \\"
echo "     --name $SWA_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --setting-names \\"
echo "       AZURE_STORAGE_CONNECTION_STRING='***CONNECTION_STRING***'"
echo ""
echo "3. Configure OAuth providers for authentication:"
echo "   • Google:    https://console.cloud.google.com/apis/credentials"
echo "   • Microsoft: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps"
echo "   • GitHub:    https://github.com/settings/developers"
echo ""
echo "   Add authorized redirect URIs:"
echo "   - Google:    https://<your-app>.azurestaticapps.net/.auth/login/google/callback"
echo "   - Microsoft: https://<your-app>.azurestaticapps.net/.auth/login/aad/callback"
echo "   - GitHub:    https://<your-app>.azurestaticapps.net/.auth/login/github/callback"
echo ""
echo "4. Update staticwebapp.config.json with auth routes"
echo "   (See documentation/user-authentication-storage-design.md)"
echo ""
echo "5. Install Azure SDK in API project:"
echo "   cd api && npm install @azure/data-tables"
echo ""
echo "6. Implement backend API endpoints"
echo "   (See documentation/user-authentication-storage-design.md)"
echo ""
echo "7. Implement frontend authentication module"
echo "   (See documentation/user-authentication-storage-design.md)"
echo ""
echo "💡 All configuration details saved to:"
echo "   documentation/user-authentication-storage-design.md"
echo ""
echo "💰 Estimated Monthly Cost:"
echo "   1,000 users:   ~$0.26/month"
echo "   10,000 users:  ~$17.60/month"
echo ""
echo "🎉 Infrastructure is ready for authentication and cloud storage!"
echo ""
