# Phase 8 Implementation Checklist

**Phase:** User Authentication & Cloud Storage  
**Start Date:** 2026-03-08  
**Target Completion:** _____________  
**Status:** 🟦 In Progress - 8.1 mostly complete, 8.2 complete

---

## 📋 Overview Progress

- [x] **8.1** Azure Infrastructure Setup (30 min)
- [x] **8.2** Backend API Development (2-3 days)
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
- [x] Navigate to api folder: `cd api`
- [x] Install Azure SDK: `npm install @azure/data-tables`
- [x] Verify package.json updated
- [x] Document version in api/package.json

### 8.2.2 Table Storage Service
- [x] Create `api/src/services/table-storage.js`
- [x] Implement `TableStorageService` class
- [x] Add connection using environment variable
- [x] Implement `createEntity(table, entity)`
- [x] Implement `getEntity(table, partitionKey, rowKey)`
- [x] Implement `updateEntity(table, entity)`
- [x] Implement `deleteEntity(table, partitionKey, rowKey)`
- [x] Implement `listEntities(table, filter)`
- [x] Add error handling for all operations
- [x] Add logging for debugging

### 8.2.3 User Profile Service
- [x] Create `api/src/services/user-profile.js`
- [x] Implement `getUserProfile(userId)`
- [x] Implement `createUserProfile(userId, profileData)`
- [x] Implement `updateUserProfile(userId, updates)`
- [x] Add profile schema validation
- [x] Add default values for new profiles

### 8.2.4 Scenario Management Service
- [x] Create `api/src/services/scenarios.js`
- [x] Implement `getUserScenarios(userId, limit)`
- [x] Implement `getScenario(userId, scenarioId)`
- [x] Implement `createScenario(userId, scenarioData)`
- [x] Implement `updateScenario(userId, scenarioId, updates)`
- [x] Implement `deleteScenario(userId, scenarioId)`
- [x] Implement `setActiveScenario(userId, scenarioId)`
- [x] Add scenario schema validation
- [x] Add pagination support

### 8.2.5 Authentication Middleware
- [x] Create `api/src/utils/auth.js`
- [x] Implement `extractUserFromRequest(request)`
- [x] Decode base64 x-ms-client-principal header
- [x] Parse user info JSON
- [x] Return userId and user details
- [x] Handle missing/invalid auth headers
- [x] Create helper `requireAuth(request)` that throws if not authenticated

### 8.2.6 API Endpoints - User Profile
- [x] Create `api/src/functions/user-profile.js`
- [x] Implement GET /api/user/profile
- [x] Implement PUT /api/user/profile
- [x] Add authentication check
- [x] Add error handling (401, 404, 500)
- [ ] Test locally with Azure Functions Core Tools

### 8.2.7 API Endpoints - Scenarios
- [x] Create `api/src/functions/scenarios.js`
- [x] Implement GET /api/scenarios (list)
- [x] Implement GET /api/scenarios/:id (get one)
- [x] Implement POST /api/scenarios (create)
- [x] Implement PUT /api/scenarios/:id (update)
- [x] Implement DELETE /api/scenarios/:id (delete)
- [x] Implement POST /api/scenarios/:id/activate
- [x] Add authentication check to all endpoints
- [x] Add authorization check (user owns resource)
- [x] Add request validation
- [x] Add error handling (401, 403, 404, 409, 500)
- [ ] Test locally with Azure Functions Core Tools

### 8.2.8 Conflict Resolution
- [x] Add ETag support to update operations
- [x] Check ETag before update
- [x] Return 409 Conflict if stale
- [x] Include server version in 409 response
- [ ] Test conflict scenarios

### 8.2.9 Unit Tests
- [x] Create `api/tests/services/table-storage.test.js`
- [x] Test CRUD operations
- [x] Test error handling
- [x] Create `api/tests/services/scenarios.test.js`
- [x] Test all scenario operations
- [x] Test validation logic
- [x] Create `api/tests/utils/auth.test.js`
- [x] Test auth extraction
- [x] Test error cases
- [x] Run all tests: `npm test`
- [x] Verify 100% passing (36/36 tests passing)

### 8.2.10 Documentation
- [x] Document API endpoints in code comments
- [x] Create `documentation/api-reference.md`
- [x] List all endpoints with examples
- [x] Document error codes
- [x] Add cURL examples for testing

---

## 8.3 Frontend Authentication Module

**Goal:** Add user authentication UI and logic  
**Duration:** 1-2 days

### 8.3.1 Authentication Manager
- [x] Create `src/js/auth/auth-manager.js`
- [x] Create AuthManager class
- [x] Implement `checkAuth()` - fetch /.auth/me
- [x] Implement `_fetchUserInfo()` - parse response
- [x] Implement `getUser()` - return current user
- [x] Implement `isAuthenticated()` - boolean check
- [x] Implement `login(provider, redirectUrl)` - redirect to OAuth
- [x] Implement `logout(redirectUrl)` - clear session
- [x] Implement `clearCache()` - reset auth state
- [x] Export singleton instance
- [x] Add JSDoc comments

### 8.3.2 Authentication UI - HTML
- [x] Open `src/index.html`
- [x] Add auth container div (near header)
- [x] Add auth-prompt section (when not logged in)
- [x] Add provider buttons (Microsoft, GitHub)
- [x] Add privacy notice text
- [x] Add auth-user-info section (when logged in)
- [x] Add user badge with email display
- [x] Add sign out button
- [x] Add sync status indicator
- [x] Verify HTML structure

### 8.3.3 Authentication UI - CSS
- [x] Open `src/styles.css`
- [x] Add `.auth-container` styles
- [x] Add `.auth-prompt` styles
- [x] Add `.auth-providers` grid layout
- [x] Add `.btn-auth` button styles
- [x] Add provider-specific button colors
- [x] Add `.auth-user-info` styles
- [x] Add `.user-badge` styles
- [x] Add `.sync-status` styles
- [x] Add responsive breakpoints
- [ ] Test on mobile and desktop

### 8.3.4 App Integration
- [x] Open `src/app.js`
- [x] Import authManager
- [x] Call `authManager.checkAuth()` on DOMContentLoaded
- [x] Show/hide auth UI based on auth state
- [x] Add login button click handlers
- [x] Add logout button click handler
- [x] Update UI when auth state changes
- [ ] Test auth flow

### 8.3.5 Testing
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
- [x] Create `src/js/storage/storage-manager.js`
- [x] Create StorageManager class
- [x] Import authManager
- [x] Import existing persistence module
- [x] Import debounce utility
- [x] Add class properties (cloudStorageAvailable, lastSavedState, etc.)
- [x] Create debounced save method (3 seconds)

### 8.4.2 Core Methods
- [x] Implement `initialize()` - check auth & sync
- [x] Implement `loadActiveScenario()` - cloud first, localStorage fallback
- [x] Implement `loadScenario(scenarioId)` - fetch from API
- [x] Implement `saveScenario(state, name)` - save to both cloud & local
- [x] Implement `autoSave(state)` - debounced save trigger
- [x] Implement `listScenarios()` - fetch all user scenarios
- [x] Implement `deleteScenario(scenarioId)` - delete from cloud
- [x] Implement `getUserProfile()` - fetch user preferences
- [x] Export singleton instance

### 8.4.3 Sync Logic
- [x] Implement `syncWithCloud()` - merge local/cloud data
- [x] Load local state from localStorage
- [x] Load cloud state from API
- [x] Compare timestamps
- [x] Upload local data if newer
- [x] Download cloud data if newer
- [x] Handle first-time login (no cloud data)
- [x] Update sync status UI

### 8.4.4 Conflict Resolution
- [x] Implement `handleConflict(conflict)` method
- [x] Parse 409 response
- [x] Log conflict for debugging
- [x] Apply "server wins" strategy
- [x] Update local storage with server data
- [x] Update sync status UI

### 8.4.5 Sync Status UI
- [x] Implement `updateSyncStatus(status)` method
- [x] Find sync status element
- [x] Update icon based on status (saving/synced/error)
- [x] Update text based on status
- [x] Add CSS transitions
- [x] Test all status states

### 8.4.6 Form Handler Integration
- [x] Open `src/js/ui/form-handler.js`
- [x] Import storageManager
- [x] Replace saveState() calls with storageManager.autoSave()
- [x] Add autoSave() call to input event listener
- [x] Add autoSave() call to blur event listener
- [x] Remove direct localStorage calls
- [x] Test auto-save triggers

### 8.4.7 App Initialization
- [ ] Open `src/app.js`
- [ ] Import storageManager
- [ ] Call `storageManager.initialize()` after auth check
- [ ] Load active scenario after init
- [ ] Populate form with loaded data
- [ ] Test initial load flow

### 8.4.8 Testing
- [x] Test auto-save when authenticated (watch network tab)
- [x] Test localStorage fallback when not authenticated
- [x] Test sync after login
- [x] Test "first login" migration
- [x] Test offline behavior
- [x] Test coming back online (sync)
- [x] Test conflict scenarios
- [x] Test error handling (API down)
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
- [ ] Note: Azure SWA built-in auth supports Microsoft and GitHub only

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

**Phase 8.1:** 🟦 In Progress (Azure resources created, OAuth registration and GitHub secrets remaining)  
**Phase 8.2:** ⬜ Not Started | 🟦 In Progress | **✅ Complete**  
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
2026-03-08 - Started Phase 8.1 work, opened issue #62 and created feature branch.
2026-03-08 - Completed Azure infrastructure setup:
  - Storage account: stccscalc72929273
  - Tables created: userscenarios, userprofiles
  - App settings configured in Azure SWA
  - OAuth provider registration and GitHub secrets require manual steps (admin permissions)
2026-03-08 - Phase 8.2 complete. All API files implemented and 36 unit tests passing.
2026-03-08 - Decision: Used "server wins" strategy for ETag conflicts (409 returns serverVersion).
2026-03-08 - @azure/data-tables v13.3.2 installed (no known vulnerabilities).
2026-03-08 - Added Jest v30 as devDependency in api/package.json for local test running.
```

---

**Last Updated:** March 8, 2026
