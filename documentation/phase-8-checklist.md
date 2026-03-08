# Phase 8 Implementation Checklist

**Phase:** User Authentication & Cloud Storage  
**Start Date:** 2026-03-08  
**Target Completion:** _____________  
**Status:** 🟦 In Progress

---

## 📋 Overview Progress

- [ ] **8.1** Azure Infrastructure Setup (30 min)
- [ ] **8.2** Backend API Development (2-3 days)
- [ ] **8.3** Frontend Authentication Module (1-2 days)
- [ ] **8.4** Frontend Storage Manager (2-3 days)
- [ ] **8.5** Static Web App Configuration (repo) (30 min)
- [ ] **8.6** Testing & Polish (2-3 days)
- [ ] **8.7** Documentation & Privacy (1 day)
- [ ] **8.8** Deployment (1 day)

---

## 8.1 Azure Infrastructure Setup (CLI)

**Goal:** Provision all Azure resources needed for authentication and storage  
**Duration:** 30 minutes  
**Manual Guide:** `documentation/phase-8-1-azure-setup-guide.md`  
**Status:** Mostly Complete - OAuth registration remaining

### Prerequisites
- [x] Azure CLI installed and working (`az --version`)
- [x] Azure subscription with appropriate permissions
- [x] OpenSSL available (for random string generation)

### Tasks - Automated (Complete)
- [x] Create detailed setup guide with subscription/resource group details
- [x] Run setup commands to create storage account
- [x] Save connection string to secure location
- [x] Verify storage account created: `stccscalc72929273`
- [x] Verify tables created (userscenarios, userprofiles)
- [x] Document resource names in guide
- [x] Add Azure SWA app settings (connection string, table names)

### OAuth Provider Registration (Manual - Remaining)
⚠️ **Note:** Azure SWA built-in auth only supports Microsoft (Entra ID) and GitHub
- [ ] Register Microsoft OAuth app (Entra ID/Azure AD) - `/.auth/login/aad`
- [ ] Register GitHub OAuth app - `/.auth/login/github`
- [ ] Add redirect URI for each provider
- [ ] Save client IDs/secrets securely

### GitHub Secrets (Manual - Remaining)
Note: Requires repository admin permissions
- [ ] Go to GitHub repo settings → Secrets
- [ ] Add AZURE_STORAGE_CONNECTION_STRING (value in guide)
- [ ] Add AZURE_STATIC_WEB_APPS_API_TOKEN (get from Azure portal)
- [ ] Verify secrets are masked

### Outputs to Save
```
Resource Group: ________________
Storage Account: ________________
Connection String: ________________
Location: ________________
```

---

## 8.2 Backend API Development

**Goal:** Build Azure Functions API for scenario management  
**Duration:** 2-3 days

### 8.2.1 Setup & Dependencies
- [ ] Navigate to api folder: `cd api`
- [ ] Install Azure SDK: `npm install @azure/data-tables`
- [ ] Verify package.json updated
- [ ] Document version in api/package.json

### 8.2.2 Table Storage Service
- [ ] Create `api/src/services/table-storage.js`
- [ ] Implement `TableStorageService` class
- [ ] Add connection using environment variable
- [ ] Implement `createEntity(table, entity)`
- [ ] Implement `getEntity(table, partitionKey, rowKey)`
- [ ] Implement `updateEntity(table, entity)`
- [ ] Implement `deleteEntity(table, partitionKey, rowKey)`
- [ ] Implement `listEntities(table, filter)`
- [ ] Add error handling for all operations
- [ ] Add logging for debugging

### 8.2.3 User Profile Service
- [ ] Create `api/src/services/user-profile.js`
- [ ] Implement `getUserProfile(userId)`
- [ ] Implement `createUserProfile(userId, profileData)`
- [ ] Implement `updateUserProfile(userId, updates)`
- [ ] Add profile schema validation
- [ ] Add default values for new profiles

### 8.2.4 Scenario Management Service
- [ ] Create `api/src/services/scenarios.js`
- [ ] Implement `getUserScenarios(userId, limit)`
- [ ] Implement `getScenario(userId, scenarioId)`
- [ ] Implement `createScenario(userId, scenarioData)`
- [ ] Implement `updateScenario(userId, scenarioId, updates)`
- [ ] Implement `deleteScenario(userId, scenarioId)`
- [ ] Implement `setActiveScenario(userId, scenarioId)`
- [ ] Add scenario schema validation
- [ ] Add pagination support

### 8.2.5 Authentication Middleware
- [ ] Create `api/src/utils/auth.js`
- [ ] Implement `extractUserFromRequest(request)`
- [ ] Decode base64 x-ms-client-principal header
- [ ] Parse user info JSON
- [ ] Return userId and user details
- [ ] Handle missing/invalid auth headers
- [ ] Create helper `requireAuth(request)` that throws if not authenticated

### 8.2.6 API Endpoints - User Profile
- [ ] Create `api/src/functions/user-profile.js`
- [ ] Implement GET /api/user/profile
- [ ] Implement PUT /api/user/profile
- [ ] Add authentication check
- [ ] Add error handling (401, 404, 500)
- [ ] Test locally with Azure Functions Core Tools

### 8.2.7 API Endpoints - Scenarios
- [ ] Create `api/src/functions/scenarios.js`
- [ ] Implement GET /api/scenarios (list)
- [ ] Implement GET /api/scenarios/:id (get one)
- [ ] Implement POST /api/scenarios (create)
- [ ] Implement PUT /api/scenarios/:id (update)
- [ ] Implement DELETE /api/scenarios/:id (delete)
- [ ] Implement POST /api/scenarios/:id/activate
- [ ] Add authentication check to all endpoints
- [ ] Add authorization check (user owns resource)
- [ ] Add request validation
- [ ] Add error handling (401, 403, 404, 409, 500)
- [ ] Test locally with Azure Functions Core Tools

### 8.2.8 Conflict Resolution
- [ ] Add ETag support to update operations
- [ ] Check ETag before update
- [ ] Return 409 Conflict if stale
- [ ] Include server version in 409 response
- [ ] Test conflict scenarios

### 8.2.9 Unit Tests
- [ ] Create `api/tests/services/table-storage.test.js`
- [ ] Test CRUD operations
- [ ] Test error handling
- [ ] Create `api/tests/services/scenarios.test.js`
- [ ] Test all scenario operations
- [ ] Test validation logic
- [ ] Create `api/tests/utils/auth.test.js`
- [ ] Test auth extraction
- [ ] Test error cases
- [ ] Run all tests: `npm test`
- [ ] Verify 100% passing

### 8.2.10 Documentation
- [ ] Document API endpoints in code comments
- [ ] Create `documentation/api-reference.md`
- [ ] List all endpoints with examples
- [ ] Document error codes
- [ ] Add cURL examples for testing

---

## 8.3 Frontend Authentication Module

**Goal:** Add user authentication UI and logic  
**Duration:** 1-2 days

### 8.3.1 Authentication Manager
- [ ] Create `src/js/auth/auth-manager.js`
- [ ] Create AuthManager class
- [ ] Implement `checkAuth()` - fetch /.auth/me
- [ ] Implement `_fetchUserInfo()` - parse response
- [ ] Implement `getUser()` - return current user
- [ ] Implement `isAuthenticated()` - boolean check
- [ ] Implement `login(provider, redirectUrl)` - redirect to OAuth
- [ ] Implement `logout(redirectUrl)` - clear session
- [ ] Implement `clearCache()` - reset auth state
- [ ] Export singleton instance
- [ ] Add JSDoc comments

### 8.3.2 Authentication UI - HTML
- [ ] Open `src/index.html`
- [ ] Add auth container div (near header)
- [ ] Add auth-prompt section (when not logged in)
- [ ] Add provider buttons (Google, Microsoft, GitHub)
- [ ] Add privacy notice text
- [ ] Add auth-user-info section (when logged in)
- [ ] Add user badge with email display
- [ ] Add sign out button
- [ ] Add sync status indicator
- [ ] Verify HTML structure

### 8.3.3 Authentication UI - CSS
- [ ] Open `src/styles.css`
- [ ] Add `.auth-container` styles
- [ ] Add `.auth-prompt` styles
- [ ] Add `.auth-providers` grid layout
- [ ] Add `.btn-auth` button styles
- [ ] Add provider-specific button colors
- [ ] Add `.auth-user-info` styles
- [ ] Add `.user-badge` styles
- [ ] Add `.sync-status` styles
- [ ] Add responsive breakpoints
- [ ] Test on mobile and desktop

### 8.3.4 App Integration
- [ ] Open `src/app.js`
- [ ] Import authManager
- [ ] Call `authManager.checkAuth()` on DOMContentLoaded
- [ ] Show/hide auth UI based on auth state
- [ ] Add login button click handlers
- [ ] Add logout button click handler
- [ ] Update UI when auth state changes
- [ ] Test auth flow

### 8.3.5 Testing
- [ ] Test Google login
- [ ] Test Microsoft login
- [ ] Test GitHub login
- [ ] Test logout flow
- [ ] Test redirect after login
- [ ] Test session persistence
- [ ] Test UI state updates
- [ ] Verify no console errors

---

## 8.4 Frontend Storage Manager

**Goal:** Add cloud storage with auto-save and sync  
**Duration:** 2-3 days

### 8.4.1 Storage Manager Module
- [ ] Create `src/js/storage/storage-manager.js`
- [ ] Create StorageManager class
- [ ] Import authManager
- [ ] Import existing persistence module
- [ ] Import debounce utility
- [ ] Add class properties (cloudStorageAvailable, lastSavedState, etc.)
- [ ] Create debounced save method (3 seconds)

### 8.4.2 Core Methods
- [ ] Implement `initialize()` - check auth & sync
- [ ] Implement `loadActiveScenario()` - cloud first, localStorage fallback
- [ ] Implement `loadScenario(scenarioId)` - fetch from API
- [ ] Implement `saveScenario(state, name)` - save to both cloud & local
- [ ] Implement `autoSave(state)` - debounced save trigger
- [ ] Implement `listScenarios()` - fetch all user scenarios
- [ ] Implement `deleteScenario(scenarioId)` - delete from cloud
- [ ] Implement `getUserProfile()` - fetch user preferences
- [ ] Export singleton instance

### 8.4.3 Sync Logic
- [ ] Implement `syncWithCloud()` - merge local/cloud data
- [ ] Load local state from localStorage
- [ ] Load cloud state from API
- [ ] Compare timestamps
- [ ] Upload local data if newer
- [ ] Download cloud data if newer
- [ ] Handle first-time login (no cloud data)
- [ ] Update sync status UI

### 8.4.4 Conflict Resolution
- [ ] Implement `handleConflict(conflict)` method
- [ ] Parse 409 response
- [ ] Log conflict for debugging
- [ ] Apply "server wins" strategy
- [ ] Update local storage with server data
- [ ] Update sync status UI

### 8.4.5 Sync Status UI
- [ ] Implement `updateSyncStatus(status)` method
- [ ] Find sync status element
- [ ] Update icon based on status (saving/synced/error)
- [ ] Update text based on status
- [ ] Add CSS transitions
- [ ] Test all status states

### 8.4.6 Form Handler Integration
- [ ] Open `src/js/ui/form-handler.js`
- [ ] Import storageManager
- [ ] Replace saveState() calls with storageManager.autoSave()
- [ ] Add autoSave() call to input event listener
- [ ] Add autoSave() call to blur event listener
- [ ] Remove direct localStorage calls
- [ ] Test auto-save triggers

### 8.4.7 App Initialization
- [ ] Open `src/app.js`
- [ ] Import storageManager
- [ ] Call `storageManager.initialize()` after auth check
- [ ] Load active scenario after init
- [ ] Populate form with loaded data
- [ ] Test initial load flow

### 8.4.8 Testing
- [ ] Test auto-save when authenticated (watch network tab)
- [ ] Test localStorage fallback when not authenticated
- [ ] Test sync after login
- [ ] Test "first login" migration
- [ ] Test offline behavior
- [ ] Test coming back online (sync)
- [ ] Test conflict scenarios
- [ ] Test error handling (API down)
- [ ] Verify sync status updates

---

## 8.5 Static Web App Configuration (repo)

**Goal:** Configure authentication routes and API protection  
**Duration:** 30 minutes

### 8.5.1 Update Configuration File
- [ ] Open `staticwebapp.config.json`
- [ ] Add auth login routes (`/.auth/login/*`)
- [ ] Set API routes to require `authenticated` role
- [ ] Keep health check public (`anonymous`)
- [ ] Add 401 redirect to login page
- [ ] Update CSP header for auth endpoints
- [ ] Verify JSON syntax

### 8.5.2 Testing
- [ ] Test authentication routes work
- [ ] Test API requires authentication
- [ ] Test health check is public
- [ ] Test CSP doesn't block auth
- [ ] Verify no browser console errors

---

## 8.6 Testing & Polish

**Goal:** Comprehensive testing and quality assurance  
**Duration:** 2-3 days

### 8.6.1 Integration Tests
- [ ] Write test for full auth flow
- [ ] Write test for scenario save/load cycle
- [ ] Write test for auto-save
- [ ] Write test for sync after login
- [ ] Write test for conflict detection
- [ ] Write test for error handling
- [ ] Write test for localStorage fallback
- [ ] Run all integration tests
- [ ] Verify 100% passing

### 8.6.2 Manual Testing Checklist
- [ ] Sign in with Google
- [ ] Sign in with Microsoft
- [ ] Sign in with GitHub
- [ ] Enter calculator data
- [ ] Verify auto-save (wait 3 seconds, check network)
- [ ] Log out
- [ ] Log back in
- [ ] Verify data persisted
- [ ] Open on different device/browser
- [ ] Verify data synced
- [ ] Go offline (disable network)
- [ ] Edit data
- [ ] Verify localStorage used
- [ ] Go back online
- [ ] Verify sync to cloud
- [ ] Check sync status indicator updates
- [ ] Test "first login" migration
- [ ] Test scenario deletion
- [ ] Test multiple children
- [ ] Test all form fields

### 8.6.3 Performance Testing
- [ ] Measure API response time (use browser DevTools)
- [ ] Verify < 200ms for GET requests
- [ ] Verify < 500ms for POST/PUT requests
- [ ] Measure auto-save latency
- [ ] Verify saves within 3 seconds
- [ ] Test with 10+ saved scenarios
- [ ] Test concurrent edits (multiple tabs)
- [ ] Test rapid input changes
- [ ] Profile JavaScript performance
- [ ] Check for memory leaks

### 8.6.4 Browser Compatibility
- [ ] Test Chrome (latest)
- [ ] Test Firefox (latest)
- [ ] Test Safari (latest)
- [ ] Test Edge (latest)
- [ ] Test iOS Safari (mobile)
- [ ] Test Android Chrome (mobile)
- [ ] Check for polyfill needs

### 8.6.5 Accessibility Testing
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify ARIA labels present
- [ ] Check color contrast (WCAG AA)
- [ ] Verify focus indicators visible
- [ ] Test auth UI accessibility
- [ ] Check form labels and errors

### 8.6.6 Security Testing
- [ ] Verify users can only access own data
- [ ] Test with different user IDs
- [ ] Test expired session handling
- [ ] Verify HTTPS enforcement
- [ ] Check CSP headers (no violations)
- [ ] Test for XSS vulnerabilities
- [ ] Test API input validation
- [ ] Review error messages (no sensitive info leaked)

---

## 8.7 Documentation & Privacy

**Goal:** Clear documentation and privacy compliance  
**Duration:** 1 day

### 8.7.1 Update README
- [ ] Open `README.md`
- [ ] Add authentication feature section
- [ ] Document OAuth provider setup
- [ ] List environment variables needed
- [ ] Add troubleshooting section
- [ ] Update installation steps
- [ ] Add FAQ section

### 8.7.2 Create Privacy Policy
- [ ] Create `src/privacy.html`
- [ ] Add header/footer matching main site
- [ ] Explain what data is collected
- [ ] Explain why data is collected
- [ ] Explain how data is stored
- [ ] List user rights (access, modify, delete, export)
- [ ] Document data retention policy
- [ ] Add contact information
- [ ] Link from footer in `index.html`

### 8.7.3 Data Deletion
- [ ] Create "Delete My Data" page or button
- [ ] Add confirmation dialog
- [ ] Document deletion process
- [ ] Test deletion flow
- [ ] Verify data actually deleted from Azure

### 8.7.4 API Documentation
- [ ] Create `documentation/api-reference.md`
- [ ] List all endpoints
- [ ] Document request formats
- [ ] Document response formats
- [ ] Add example cURL commands
- [ ] Document error codes
- [ ] Add authentication section
- [ ] Document rate limiting (if any)

### 8.7.5 User Guide
- [ ] Create `documentation/user-guide.md`
- [ ] Explain how to sign in
- [ ] Explain auto-save feature
- [ ] Document multi-device usage
- [ ] Add screenshots/diagrams
- [ ] Create FAQ section
- [ ] Explain sync status indicator

### 8.7.6 OAuth Setup Guide
- [ ] Create `documentation/oauth-setup.md`
- [ ] Step-by-step Microsoft OAuth setup (Entra ID/Azure AD)
- [ ] Step-by-step GitHub OAuth setup
- [ ] Add screenshots
- [ ] Document redirect URIs
- [ ] Document where to add secrets
- [ ] Note: Google NOT supported by Azure SWA built-in auth

### 8.7.7 Update Master Plan
- [ ] Open `master-plan.md`
- [ ] Mark completed Phase 8 tasks with [x]
- [ ] Update "Current Status" section
- [ ] Add Phase 8 completion summary
- [ ] Move 🎯 NEXT marker to next phase

---

## 8.8 Deployment

**Goal:** Deploy to production with monitoring  
**Duration:** 1 day

### 8.8.1 GitHub Actions Workflow
- [ ] Open `.github/workflows/azure-static-web-apps.yml`
- [ ] Add environment variables
- [ ] Add Azure credentials
- [ ] Configure API deployment
- [ ] Add smoke tests step
- [ ] Test workflow locally (if possible)
- [ ] Commit workflow changes

### 8.8.2 Deploy to Azure
- [ ] Push code to main branch
- [ ] Monitor GitHub Actions run
- [ ] Check for build errors
- [ ] Verify deployment successful
- [ ] Check deployment logs
- [ ] Verify API functions deployed
- [ ] Test health check endpoint

### 8.8.3 Custom Domain (Optional)
- [ ] Configure DNS records
- [ ] Add custom domain in Azure
- [ ] Configure SSL certificate
- [ ] Update OAuth redirect URIs
- [ ] Test with custom domain
- [ ] Verify HTTPS works

### 8.8.4 Monitoring & Alerts
- [ ] Enable Application Insights
- [ ] Create dashboard for key metrics
- [ ] Configure error alerts
- [ ] Configure availability monitoring
- [ ] Set up notification channels
- [ ] Test alerting (trigger error)

### 8.8.5 Smoke Tests in Production
- [ ] Test authentication flow
- [ ] Test scenario save
- [ ] Test scenario load
- [ ] Test API endpoints directly
- [ ] Check error rates in Azure Portal
- [ ] Verify monitoring working
- [ ] Check performance metrics

### 8.8.6 Announcement
- [ ] Create announcement banner (optional)
- [ ] Update help documentation
- [ ] Post on social media (if applicable)
- [ ] Send email to users (if applicable)
- [ ] Update project status

---

## ✅ Phase 8 Completion Criteria

Check all before marking Phase 8 complete:

### Functionality
- [ ] Users can sign in with Google
- [ ] Users can sign in with Microsoft
- [ ] Users can sign in with GitHub
- [ ] Scenarios auto-save within 3 seconds
- [ ] Scenarios sync across devices
- [ ] App works offline (localStorage fallback)
- [ ] Sync status indicator shows current state
- [ ] Users can log out

### Quality
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing complete
- [ ] Performance targets met (< 200ms API, < 3s auto-save)
- [ ] Zero security vulnerabilities
- [ ] Accessibility requirements met (WCAG AA)
- [ ] Browser compatibility verified

### Documentation
- [ ] README updated
- [ ] Privacy policy created
- [ ] API documentation complete
- [ ] User guide created
- [ ] OAuth setup guide complete
- [ ] Master plan updated

### Deployment
- [ ] Deployed to production
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Smoke tests passed
- [ ] No critical errors in logs

### Cost & Performance
- [ ] Storage costs within budget
- [ ] API performance acceptable
- [ ] No quota issues
- [ ] Monitoring shows healthy metrics

---

## 📊 Progress Tracking

**Phase 8.1:** 🟦 In Progress (Azure resources created, OAuth registration remaining)  
**Phase 8.2:** ⬜ Not Started | 🟦 In Progress | ✅ Complete  
**Phase 8.3:** ⬜ Not Started | 🟦 In Progress | ✅ Complete  
**Phase 8.4:** ⬜ Not Started | 🟦 In Progress | ✅ Complete  
**Phase 8.5:** ⬜ Not Started | 🟦 In Progress | ✅ Complete  
**Phase 8.6:** ⬜ Not Started | 🟦 In Progress | ✅ Complete  
**Phase 8.7:** ⬜ Not Started | 🟦 In Progress | ✅ Complete  
**Phase 8.8:** ⬜ Not Started | 🟦 In Progress | ✅ Complete  

**Overall Phase 8:** 🟦 In Progress

---

## 📝 Notes

Use this section for implementation notes, issues encountered, and decisions made:

```
[Date] - [Note]

Example:
2026-03-07 - Started Phase 8.1, ran Azure setup script successfully
2026-03-07 - Storage account created: stccscalc1a2b3c4d
2026-03-08 - Decision: Using "server wins" for conflict resolution initially
2026-03-08 - Started Phase 8.1 work, opened issue #62 and created feature branch
2026-03-08 - Completed Azure infrastructure setup:
  - Storage account: stccscalc72929273
  - Tables created: userscenarios, userprofiles
  - App settings configured in Azure SWA
  - OAuth provider registration and GitHub secrets require manual steps (admin permissions)
```

---

**Last Updated:** March 8, 2026
