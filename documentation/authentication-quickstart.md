# Authentication & Cloud Storage - Quick Start Guide

**Status:** Design Complete ✅ | Ready for Implementation 🚀  
**Date:** March 7, 2026

## What Has Been Done

### 1. Comprehensive Design Document ✅
**Location:** `documentation/user-authentication-storage-design.md`

This 300+ line document includes:
- Architecture overview with diagrams
- Azure Static Web App authentication design
- Azure Table Storage data model
- Complete API endpoint specifications
- Frontend module designs with code examples
- Security and privacy analysis
- Cost estimates ($0.26/month for 1K users, $17.60/month for 10K users)
- Implementation plan with timeline
- Testing strategy
- Migration strategy for existing users

### 2. Azure Infrastructure Setup Script ✅
**Location:** `scripts/setup-azure-auth-storage.sh`

Executable bash script that:
- Creates Azure Resource Group
- Creates Azure Storage Account
- Creates Table Storage tables (userscenarios, userprofiles)
- Retrieves connection strings
- Provides next steps for OAuth configuration
- Includes error handling and confirmation prompts
- Already made executable with `chmod +x`

### 3. Updated Master Plan ✅
**Location:** `master-plan.md`

Phase 8 has been completely rewritten with:
- 8 sub-phases with detailed task lists
- 80+ specific tasks marked as incomplete
- Clear acceptance criteria
- Risk assessment and mitigation
- Future enhancement ideas
- Marked as "🎯 NEXT" phase

## Quick Start - Next Steps

### Step 1: Provision Azure Infrastructure (30 minutes)

```bash
cd /workspaces/CCS-Calculator
./scripts/setup-azure-auth-storage.sh
```

This will:
1. Login to Azure (if not already)
2. Create storage account with random suffix
3. Create Table Storage tables
4. Output connection string (SAVE THIS!)

**Save the connection string** - you'll need it for:
- Azure Static Web App configuration
- GitHub Secrets
- Local development (.env file)

### Step 2: Configure OAuth Providers (30-60 minutes)

After infrastructure is created, register your app with OAuth providers:

⚠️ **Important:** Azure SWA built-in auth only supports Microsoft and GitHub (NOT Google)

#### Microsoft OAuth (Entra ID/Azure AD)
1. Go to: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
2. Click "New registration"
3. Add redirect URI: `https://YOUR-APP.azurestaticapps.net/.auth/login/aad/callback`

#### GitHub OAuth
1. Go to: https://github.com/settings/developers
2. Create "OAuth App"
3. Set callback URL: `https://YOUR-APP.azurestaticapps.net/.auth/login/github/callback`

### Step 3: Update Static Web App Settings

```bash
# Add to your Static Web App
az staticwebapp appsettings set \
  --name swa-ccs-calculator \
  --resource-group rg-ccs-calculator \
  --setting-names \
    AZURE_STORAGE_CONNECTION_STRING="YOUR_CONNECTION_STRING_HERE"
```

### Step 4: Begin Development

Follow the implementation plan in the master plan:

1. **Backend API** (2-3 days)
   - Install Azure SDK: `cd api && npm install @azure/data-tables`
   - Create service modules
   - Implement API endpoints
   - Write tests

2. **Frontend Auth** (1-2 days)
   - Create auth-manager.js
   - Add authentication UI
   - Wire up login/logout

3. **Frontend Storage** (2-3 days)
   - Create storage-manager.js
   - Implement auto-save
   - Add sync status UI

4. **Testing & Deployment** (2-3 days)
   - Integration tests
   - Manual testing
   - Deploy to production

## Key Design Decisions

### Why Azure Table Storage?
- **Cost-effective**: $0.05/GB/month (vs $0.25/GB for Cosmos DB)
- **Simple**: NoSQL key-value store, perfect for scenarios
- **Fast**: Millisecond lookups by partition key (userId)
- **Scalable**: Handles millions of entities

### Why Built-in Azure SWA Authentication?
- **No frontend SDK needed**: Uses standard OAuth redirects
- **Zero maintenance**: Microsoft manages OAuth flows
- **Secure by default**: Industry-standard implementation
- **Multiple providers**: Microsoft and GitHub out-of-the-box

### Why Progressive Enhancement?
- **No breaking changes**: App works without authentication
- **User choice**: Login is optional, not required
- **Fallback ready**: localStorage always works
- **Privacy-first**: Users control their data

## Architecture At-a-Glance

```
User Browser
    ↓
Azure Static Web App (built-in auth)
    ↓
Azure Functions (Node.js 20)
    ↓
Azure Table Storage
    ├── userscenarios (scenarios)
    └── userprofiles (user preferences)
```

## Key Features

✅ **Auto-save**: Every 3 seconds after changes  
✅ **Cross-device sync**: Access from any device  
✅ **Offline support**: Works without internet (localStorage)  
✅ **Multiple providers**: Microsoft and GitHub  
✅ **Privacy-first**: Transparent data usage, easy deletion  
✅ **Progressive**: App works without login  
✅ **Conflict resolution**: Handles multi-device editing  
✅ **Cost-effective**: ~$17/month for 10,000 users  

## File Structure Preview

```
/workspaces/CCS-Calculator/
├── scripts/
│   └── setup-azure-auth-storage.sh       # ✅ Infrastructure setup
├── documentation/
│   └── user-authentication-storage-design.md  # ✅ Complete design
├── master-plan.md                         # ✅ Updated with Phase 8
├── api/
│   ├── package.json                       # ⏳ Add @azure/data-tables
│   └── src/
│       ├── services/
│       │   ├── table-storage.js          # ⏳ Create
│       │   ├── user-profile.js           # ⏳ Create
│       │   └── scenarios.js              # ⏳ Create
│       ├── functions/
│       │   ├── user-profile.js           # ⏳ Create
│       │   └── scenarios.js              # ⏳ Create
│       └── utils/
│           └── auth.js                   # ⏳ Create
└── src/
    ├── js/
    │   ├── auth/
    │   │   └── auth-manager.js           # ⏳ Create
    │   └── storage/
    │       └── storage-manager.js        # ⏳ Create
    ├── index.html                         # ⏳ Add auth UI
    ├── styles.css                         # ⏳ Add auth styles
    └── privacy.html                       # ⏳ Create

Legend: ✅ Complete | ⏳ To be created
```

## Estimated Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Infrastructure Setup | 30 min | Run Azure CLI script |
| OAuth Configuration | 30-60 min | Register with providers |
| Backend API | 2-3 days | Azure Functions + Table Storage |
| Frontend Auth | 1-2 days | Auth module + UI |
| Frontend Storage | 2-3 days | Storage manager + auto-save |
| Testing & Polish | 2-3 days | Integration tests + manual QA |
| Documentation | 1 day | Privacy policy + user guide |
| Deployment | 1 day | Deploy + monitoring |
| **Total** | **2-3 weeks** | End-to-end implementation |

## Cost Analysis

### Per User Costs

| Users | Storage | Transactions | Bandwidth | Total/Month |
|-------|---------|--------------|-----------|-------------|
| 1,000 | $0.25 | $0.01 | Free tier | **$0.26** |
| 10,000 | $2.50 | $0.10 | $15.00 | **$17.60** |
| 100,000 | $25.00 | $1.00 | $150.00 | **$176.00** |

### Assumptions
- 5 MB storage per user
- 100 saves per user per month
- 10 MB data transfer per user per month

## Security & Privacy

✅ **Authentication**: OAuth 2.0 (industry standard)  
✅ **Authorization**: User ID validation on every request  
✅ **Data encryption**: HTTPS in transit, encrypted at rest  
✅ **Data isolation**: Partition key = User ID (automatic)  
✅ **Privacy compliance**: Australian Privacy Principles compliant  
✅ **User rights**: Access, modify, export, delete all data  

## Questions or Issues?

Refer to the comprehensive design document:
- Architecture details → Section 2
- Authentication flow → Section 3
- Data model → Section 4
- API specs → Section 5
- Security → Section 7
- Azure setup → Section 8

## Success Criteria

Before marking Phase 8 complete:

- [ ] Users can sign in with 2 providers (Microsoft, GitHub)
- [ ] Scenarios auto-save within 3 seconds
- [ ] Scenarios sync across devices
- [ ] App works offline with localStorage fallback
- [ ] Sync status indicator shows current state
- [ ] Privacy policy is accessible
- [ ] Users can delete their data
- [ ] All tests pass (unit + integration)
- [ ] API responses < 200ms
- [ ] Zero security vulnerabilities
- [ ] Deployed to production
- [ ] Monitoring enabled

---

**Ready to begin?** Run the Azure setup script and start with Phase 8.1! 🚀
