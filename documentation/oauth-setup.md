# OAuth Setup Guide

**Azure Static Web Apps — Microsoft & GitHub Authentication**  
**Last Updated:** March 2026

---

## Overview

The CCS Calculator uses **Azure Static Web Apps built-in authentication**, which provides zero-maintenance OAuth 2.0 for Microsoft (Entra ID / Azure AD) and GitHub. There is no OAuth SDK in the frontend — the Azure SWA gateway handles the entire flow.

> ⚠️ Azure SWA built-in auth supports **Microsoft** and **GitHub** only. Google and other providers are not supported with the built-in method.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Azure account | Free tier is sufficient |
| Azure Static Web App deployed | See `documentation/phase-8-1-azure-setup-guide.md` |
| Azure Storage account | Required for user data persistence |
| GitHub account | For GitHub OAuth provider registration |
| Microsoft account / Azure AD tenant | For Microsoft OAuth provider registration |

---

## 1. Microsoft OAuth (Entra ID / Azure AD)

### 1.1 Register the Application

1. Go to the [Azure Portal App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Click **"+ New registration"**.
3. Fill in the form:
   - **Name:** `CCS Calculator`
   - **Supported account types:** Select **"Accounts in any organizational directory and personal Microsoft accounts"** (allows both work/school and personal Microsoft accounts).
   - **Redirect URI:** Leave blank for now.
4. Click **"Register"**.
5. Note the **Application (client) ID** — you will need it later.

### 1.2 Add Redirect URI

1. In your new app registration, click **"Authentication"** in the left sidebar.
2. Click **"+ Add a platform"** → choose **"Web"**.
3. Set the Redirect URI to:
   ```
   https://<your-swa-name>.azurestaticapps.net/.auth/login/aad/callback
   ```
   Replace `<your-swa-name>` with your Azure Static Web App hostname.
4. Under **"Implicit grant and hybrid flows"**, tick **"ID tokens"**.
5. Click **"Save"**.

### 1.3 Create a Client Secret

1. Click **"Certificates & secrets"** in the left sidebar.
2. Click **"+ New client secret"**.
3. Set a description (e.g. "CCS Calculator SWA") and an expiry (12 or 24 months).
4. Click **"Add"**.
5. **Copy the secret value immediately** — it is only shown once.

### 1.4 Configure SWA

Add the client ID and secret to your Static Web App application settings:

```bash
az staticwebapp appsettings set \
  --name <your-swa-name> \
  --resource-group <your-resource-group> \
  --setting-names \
    MICROSOFT_PROVIDER_AUTHENTICATION_SECRET="<client-secret>"
```

Then update `staticwebapp.config.json` in the repository:

```json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/<tenant-id>/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"
        }
      }
    }
  }
}
```

Set `AZURE_CLIENT_ID` in application settings:

```bash
az staticwebapp appsettings set \
  --name <your-swa-name> \
  --resource-group <your-resource-group> \
  --setting-names \
    AZURE_CLIENT_ID="<application-client-id>"
```

> For a **multi-tenant** app (any Microsoft account) use the issuer:
> `https://login.microsoftonline.com/common/v2.0`

---

## 2. GitHub OAuth

### 2.1 Register the OAuth App

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers).
2. Click **"New OAuth App"**.
3. Fill in the form:
   - **Application name:** `CCS Calculator`
   - **Homepage URL:** `https://<your-swa-name>.azurestaticapps.net`
   - **Authorization callback URL:**
     ```
     https://<your-swa-name>.azurestaticapps.net/.auth/login/github/callback
     ```
4. Click **"Register application"**.
5. Note the **Client ID**.

### 2.2 Generate a Client Secret

1. On the app settings page, click **"Generate a new client secret"**.
2. **Copy the secret immediately** — it is only shown once.

### 2.3 Configure SWA

Add the GitHub client ID and secret to your Static Web App application settings:

```bash
az staticwebapp appsettings set \
  --name <your-swa-name> \
  --resource-group <your-resource-group> \
  --setting-names \
    GITHUB_PROVIDER_AUTHENTICATION_SECRET="<github-client-secret>" \
    GITHUB_CLIENT_ID="<github-client-id>"
```

Update `staticwebapp.config.json`:

```json
{
  "auth": {
    "identityProviders": {
      "github": {
        "registration": {
          "clientIdSettingName": "GITHUB_CLIENT_ID",
          "clientSecretSettingName": "GITHUB_PROVIDER_AUTHENTICATION_SECRET"
        }
      }
    }
  }
}
```

---

## 3. Combined `staticwebapp.config.json` Example

```json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/common/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"
        }
      },
      "github": {
        "registration": {
          "clientIdSettingName": "GITHUB_CLIENT_ID",
          "clientSecretSettingName": "GITHUB_PROVIDER_AUTHENTICATION_SECRET"
        }
      }
    }
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/.auth/login/aad",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/.auth/login/github",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/.auth/logout",
      "allowedRoles": ["anonymous", "authenticated"]
    }
  ],
  "responseOverrides": {
    "401": {
      "statusCode": 302,
      "redirect": "/"
    }
  }
}
```

---

## 4. Local Development

For local development with the [Azure Static Web Apps CLI](https://github.com/Azure/static-web-apps-cli):

```bash
swa start src --api-location api
```

The SWA CLI provides mock authentication at `http://localhost:4280/.auth/login/aad` and `http://localhost:4280/.auth/login/github`.

To test with real OAuth providers locally, use [ngrok](https://ngrok.com/) to expose your local port and add the ngrok URL as an additional redirect URI in your OAuth app registrations.

---

## 5. Environment Variables Summary

All secrets are stored as application settings in the Azure Static Web App (never in source code).

| Setting Name | Provider | Description |
|--------------|----------|-------------|
| `AZURE_CLIENT_ID` | Microsoft | Application (client) ID from Azure App Registration |
| `MICROSOFT_PROVIDER_AUTHENTICATION_SECRET` | Microsoft | Client secret value |
| `GITHUB_CLIENT_ID` | GitHub | OAuth App Client ID |
| `GITHUB_PROVIDER_AUTHENTICATION_SECRET` | GitHub | OAuth App Client Secret |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure | Storage account connection string for user data |

Set these with:

```bash
az staticwebapp appsettings set \
  --name <your-swa-name> \
  --resource-group <your-resource-group> \
  --setting-names \
    AZURE_CLIENT_ID="..." \
    MICROSOFT_PROVIDER_AUTHENTICATION_SECRET="..." \
    GITHUB_CLIENT_ID="..." \
    GITHUB_PROVIDER_AUTHENTICATION_SECRET="..." \
    AZURE_STORAGE_CONNECTION_STRING="..."
```

---

## 6. How Authentication Works

```
User clicks "Sign in with Microsoft"
        ↓
Browser → /.auth/login/aad  (Azure SWA gateway)
        ↓
Azure SWA → Microsoft OAuth endpoint
        ↓
User approves → Microsoft → /.auth/login/aad/callback
        ↓
Azure SWA sets encrypted session cookie
        ↓
Browser requests /.auth/me → returns user identity JSON
        ↓
Frontend auth-manager.js reads user identity
        ↓
storage-manager.js begins syncing with /api/*
```

The `x-ms-client-principal` header is injected by the SWA gateway on every API request. The backend `api/src/utils/auth.js` middleware decodes this header to identify the user.

---

## 7. Token Expiry and Refresh

Azure SWA automatically handles token refresh. Sessions are maintained via an encrypted HTTP-only cookie. The `/.auth/me` endpoint returns `null` when the session expires, prompting the frontend to redirect to login.

Default session lifetime: **8 hours** (configurable in Azure Portal).

---

## 8. Troubleshooting

| Issue | Resolution |
|-------|-----------|
| Redirect URI mismatch | Ensure the callback URL in your OAuth app registration exactly matches your SWA hostname (including trailing `/callback`). |
| `401 Unauthorized` on API calls | Check that the `x-ms-client-principal` header is present. In local dev, ensure you are using the SWA CLI (not serving files directly). |
| GitHub sign-in loop | Verify `GITHUB_CLIENT_ID` and `GITHUB_PROVIDER_AUTHENTICATION_SECRET` are set correctly in SWA application settings. |
| Microsoft sign-in loop | Check `openIdIssuer` — use `common` for multi-tenant or your specific tenant ID. |
| Cannot see `/.auth/me` in local dev | Run `swa start` not `npx serve`. Only the SWA CLI provides mock auth. |
| Client secret expired | Generate a new secret in Azure App Registration → Certificates & secrets and update the SWA application setting. |

---

## 9. Security Checklist

- [ ] Client secrets stored in SWA application settings, **not** in source code
- [ ] Redirect URIs are exact matches (no wildcard)
- [ ] `staticwebapp.config.json` protects `/api/*` routes (authenticated only)
- [ ] Client secret expiry date noted and calendar reminder set
- [ ] GitHub OAuth app has minimal scopes (user:email only)
- [ ] Microsoft app registration has minimal API permissions
- [ ] `/.auth/logout` clears session and redirects to home

---

## Related Documentation

- [API Reference](api-reference.md) — Backend endpoint specifications
- [User Authentication & Storage Design](user-authentication-storage-design.md) — Architecture overview
- [Azure Infrastructure Setup Guide](phase-8-1-azure-setup-guide.md) — Provision Azure resources
- [Privacy Policy](../src/privacy.html) — User data handling
