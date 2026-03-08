# User Authentication and Cloud Storage Design

**Document Version:** 1.0  
**Date:** March 7, 2026  
**Status:** Design Phase

## Executive Summary

This document outlines the design for adding user authentication and cloud-based scenario persistence to the CCS Calculator using Azure Static Web App's built-in authentication and Azure Table Storage. This will enable users to save scenarios across devices and sessions while maintaining the simplicity and performance of the current vanilla JavaScript architecture.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Authentication Design](#authentication-design)
4. [Data Model & Storage](#data-model--storage)
5. [API Design](#api-design)
6. [Frontend Changes](#frontend-changes)
7. [Security & Privacy](#security--privacy)
8. [Azure Infrastructure Setup](#azure-infrastructure-setup)
9. [Implementation Plan](#implementation-plan)
10. [Testing Strategy](#testing-strategy)
11. [Migration Strategy](#migration-strategy)

---

## 1. Current State Analysis

### Existing Functionality
- **Local Storage Only**: All user data stored in browser localStorage
- **Single Scenario**: Users can save one scenario at a time locally
- **No Authentication**: Anonymous access only
- **No Cross-Device Sync**: Data doesn't follow users across devices
- **Privacy-First**: No data leaves the user's browser

### Current Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Azure Functions (Node.js 20 LTS)
- **Hosting**: Azure Static Web Apps
- **Storage**: Browser localStorage only

### Limitations to Address
1. Users lose data when clearing browser cache
2. Cannot access scenarios from different devices
3. No multi-scenario management
4. No sharing capabilities in the future
5. No backup/recovery options

---

## 2. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Frontend)                        │
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  UI Layer      │  │ Local Storage│  │ Auth Client       │  │
│  │  (Vanilla JS)  │  │ (Fallback)   │  │ (Built-in SWA)    │  │
│  └────────────────┘  └──────────────┘  └───────────────────┘  │
│           │                  │                    │              │
└───────────┼──────────────────┼────────────────────┼─────────────┘
            │                  │                    │
            ▼                  │                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              Azure Static Web App (HTTPS)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Built-in Authentication Provider                         │  │
│  │  - Microsoft, Google, Twitter, GitHub                     │  │
│  │  - Handles OAuth flows, tokens, user identity            │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Azure Functions (Node.js 20)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Scenario     │  │ User Profile │  │ Sync Manager          │ │
│  │ Management   │  │ Management   │  │ (Conflict Resolution) │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Table Storage                           │
│  ┌────────────────────┐      ┌─────────────────────────────┐   │
│  │  Scenarios Table   │      │  UserProfiles Table         │   │
│  │  - User scenarios  │      │  - User preferences         │   │
│  │  - Auto-saved      │      │  - Last sync timestamp      │   │
│  └────────────────────┘      └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Progressive Enhancement**: App works without authentication (localStorage fallback)
2. **Vanilla JavaScript**: Maintain current architecture, no frameworks
3. **Minimal Dependencies**: Only Azure SDK for Functions, none for frontend
4. **Privacy-First**: Users control their data, clear data deletion paths
5. **Performance**: Auto-save with debouncing, optimistic UI updates
6. **Resilience**: Handle offline scenarios, sync conflicts gracefully

---

## 3. Authentication Design

### Azure Static Web App Built-in Authentication

Azure Static Web Apps provides built-in authentication without requiring additional code or SDKs on the frontend. It handles the entire OAuth flow automatically.

#### Supported Providers

⚠️ **Azure Static Web Apps built-in authentication supports only:**
- Microsoft (Azure AD / Entra ID)
- GitHub

**Google OAuth is NOT supported** with built-in SWA authentication. To add Google, you would need custom OAuth implementation.

#### Authentication Flow

```
User clicks "Sign In"
      │
      ▼
Redirect to /.auth/login/<provider>
      │
      ▼
User authenticates with provider (OAuth)
      │
      ▼
Redirect back to app with session cookie
      │
      ▼
App reads user info from /.auth/me endpoint
      │
      ▼
Frontend updates UI, enables cloud sync
```

#### User Identity Object

Azure SWA provides user identity via `/.auth/me`:

```json
{
  "clientPrincipal": {
    "userId": "d75b260a64504067bfc5b2905e3b8182",
    "userRoles": ["anonymous", "authenticated"],
    "identityProvider": "aad",
    "userDetails": "user@example.com"
  }
}
```

### Frontend Authentication Module

**File**: `src/js/auth/auth-manager.js`

```javascript
/**
 * Authentication Manager
 * Handles user authentication state using Azure SWA built-in auth
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.authCheckPromise = null;
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<Object|null>} User object or null
   */
  async checkAuth() {
    if (!this.authCheckPromise) {
      this.authCheckPromise = this._fetchUserInfo();
    }
    return this.authCheckPromise;
  }

  async _fetchUserInfo() {
    try {
      const response = await fetch('/.auth/me');
      const data = await response.json();
      
      if (data.clientPrincipal) {
        this.user = {
          id: data.clientPrincipal.userId,
          email: data.clientPrincipal.userDetails,
          provider: data.clientPrincipal.identityProvider,
          roles: data.clientPrincipal.userRoles
        };
        return this.user;
      }
      
      this.user = null;
      return null;
    } catch (error) {
      console.error('Auth check failed:', error);
      this.user = null;
      return null;
    }
  }

  /**
   * Get current user
   * @returns {Object|null}
   */
  getUser() {
    return this.user;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.user !== null;
  }

  /**
   * Initiate login with provider
   * @param {string} provider - 'google', 'microsoft', 'github', 'twitter'
   * @param {string} redirectUrl - URL to redirect after login
   */
  login(provider = 'google', redirectUrl = window.location.pathname) {
    const loginUrl = `/.auth/login/${provider}?post_login_redirect_uri=${encodeURIComponent(redirectUrl)}`;
    window.location.href = loginUrl;
  }

  /**
   * Logout user
   * @param {string} redirectUrl - URL to redirect after logout
   */
  logout(redirectUrl = '/') {
    const logoutUrl = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(redirectUrl)}`;
    window.location.href = logoutUrl;
  }

  /**
   * Purge authentication check cache
   */
  clearCache() {
    this.authCheckPromise = null;
    this.user = null;
  }
}

// Singleton instance
export const authManager = new AuthManager();
```

### UI Components for Authentication

**Login Prompt UI** (in `index.html`):

```html
<!-- Authentication UI -->
<div id="auth-container" class="auth-container">
  <div id="auth-status" class="auth-status">
    <!-- When not authenticated -->
    <div id="auth-prompt" class="auth-prompt" hidden>
      <p>
        <strong>💾 Save your scenarios</strong><br>
        Sign in to save your scenarios across devices and never lose your data.
      </p>
      <div class="auth-providers">
        <button type="button" class="btn-auth btn-auth-google" data-provider="google">
          <span class="auth-icon">🔐</span> Sign in with Google
        </button>
        <button type="button" class="btn-auth btn-auth-microsoft" data-provider="microsoft">
          <span class="auth-icon">🔐</span> Sign in with Microsoft
        </button>
        <button type="button" class="btn-auth btn-auth-github" data-provider="github">
          <span class="auth-icon">🔐</span> Sign in with GitHub
        </button>
      </div>
      <p class="auth-privacy-note">
        <small>
          Your data is stored securely and never shared. 
          <a href="#privacy">Read our privacy policy</a>
        </small>
      </p>
    </div>

    <!-- When authenticated -->
    <div id="auth-user-info" class="auth-user-info" hidden>
      <div class="user-badge">
        <span class="user-icon">👤</span>
        <span id="user-email" class="user-email"></span>
      </div>
      <button type="button" id="btn-logout" class="btn-logout">Sign Out</button>
      <span id="sync-status" class="sync-status">
        <span class="sync-icon">☁️</span>
        <span class="sync-text">Synced</span>
      </span>
    </div>
  </div>
</div>
```

---

## 4. Data Model & Storage

### Azure Table Storage Design

Azure Table Storage is a NoSQL key-value store optimized for fast lookups. It's cost-effective and perfect for this use case.

#### Why Table Storage?
- **Cost**: ~$0.05 per GB/month (extremely cheap)
- **Performance**: Fast key-based lookups
- **Scalability**: Handles millions of entities easily
- **Simplicity**: No schema management, easy to use
- **Serverless**: Pay only for what you use

#### Table: UserScenarios

**Partition Key**: `userId` (user ID from authentication)  
**Row Key**: `scenarioId` (GUID)

| Column | Type | Description |
|--------|------|-------------|
| PartitionKey | String | User ID |
| RowKey | String | Scenario ID (GUID) |
| Timestamp | DateTime | Auto-managed by Azure |
| scenarioName | String | User-friendly name |
| scenarioData | String | JSON blob of scenario data |
| version | Int32 | Schema version (for migrations) |
| createdAt | DateTime | When scenario was created |
| updatedAt | DateTime | Last modification time |
| isActive | Boolean | Is this the active scenario? |
| tags | String | Comma-separated tags (future) |

**Example Entity**:

```json
{
  "PartitionKey": "d75b260a64504067bfc5b2905e3b8182",
  "RowKey": "a3f8c2e1-4b5d-6789-0abc-def123456789",
  "Timestamp": "2026-03-07T10:30:00Z",
  "scenarioName": "Both parents working full-time",
  "scenarioData": "{\"parent1Income\":85000,\"parent2Income\":72000,...}",
  "version": 1,
  "createdAt": "2026-03-01T08:00:00Z",
  "updatedAt": "2026-03-07T10:30:00Z",
  "isActive": true,
  "tags": "fulltime,dual-income"
}
```

#### Table: UserProfiles

**Partition Key**: `userId`  
**Row Key**: `profile` (always "profile")

| Column | Type | Description |
|--------|------|-------------|
| PartitionKey | String | User ID |
| RowKey | String | Always "profile" |
| Timestamp | DateTime | Auto-managed by Azure |
| email | String | User email (from auth) |
| displayName | String | User display name |
| preferences | String | JSON blob of user preferences |
| lastSyncTimestamp | DateTime | Last successful sync |
| activeScenarioId | String | Currently active scenario ID |
| createdAt | DateTime | When profile was created |

**Example Entity**:

```json
{
  "PartitionKey": "d75b260a64504067bfc5b2905e3b8182",
  "RowKey": "profile",
  "Timestamp": "2026-03-07T10:30:00Z",
  "email": "user@example.com",
  "displayName": "Jane Smith",
  "preferences": "{\"theme\":\"dark\",\"defaultPeriod\":\"fortnightly\"}",
  "lastSyncTimestamp": "2026-03-07T10:30:00Z",
  "activeScenarioId": "a3f8c2e1-4b5d-6789-0abc-def123456789",
  "createdAt": "2026-02-15T12:00:00Z"
}
```

### Scenario Data Schema

The `scenarioData` field stores the complete calculator state as JSON:

```javascript
{
  "version": 1,  // Schema version
  "formData": {
    // All form field values
    "parent1Income": 85000,
    "parent1IncomeFrequency": "annual",
    "parent2Income": 72000,
    "parent2IncomeFrequency": "annual",
    "parent1Days": 5,
    "parent2Days": 5,
    "children": [
      {
        "id": "child-1",
        "age": "3",
        "schoolType": "none",
        "daysInCare": 5,
        "feeType": "daily",
        "fees": 145.00,
        "withholdingRate": 0
      }
    ]
  },
  "preferences": {
    "selectedPeriod": "fortnightly",
    "theme": "light"
  },
  "metadata": {
    "lastModified": "2026-03-07T10:30:00Z",
    "deviceId": "browser-fingerprint-hash",
    "appVersion": "1.0.0"
  }
}
```

### Storage Quotas & Limits

- **Entity Size**: Max 1 MB per entity (plenty for scenarios)
- **Property Size**: Max 64 KB per string property
- **Throughput**: 20,000 transactions per second per partition
- **Cost**: ~$0.05/GB/month + $0.00036 per 10,000 transactions

**Estimated costs for 10,000 users**:
- Storage (5 MB per user): 50 GB × $0.05 = $2.50/month
- Transactions (100 saves/user/month): 1M × $0.036 = $0.04/month
- **Total**: ~$2.54/month

---

## 5. API Design

### API Endpoints

All endpoints require authentication (except health check).

#### Base URL: `/api`

#### 1. Health Check
```
GET /api/health
Auth: None
Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2026-03-07T10:30:00Z"
}
```

#### 2. Get User Profile
```
GET /api/user/profile
Auth: Required
Response: 200 OK
{
  "userId": "d75b260a64504067bfc5b2905e3b8182",
  "email": "user@example.com",
  "preferences": {...},
  "activeScenarioId": "a3f8c2e1-...",
  "lastSyncTimestamp": "2026-03-07T10:30:00Z"
}
```

#### 3. Update User Profile
```
PUT /api/user/profile
Auth: Required
Body:
{
  "preferences": {...}
}
Response: 200 OK
{
  "success": true,
  "profile": {...}
}
```

#### 4. List User Scenarios
```
GET /api/scenarios
Auth: Required
Query Params:
  - limit: number (default: 100)
  - continuationToken: string (for pagination)
Response: 200 OK
{
  "scenarios": [
    {
      "id": "a3f8c2e1-...",
      "name": "Both parents full-time",
      "createdAt": "2026-03-01T08:00:00Z",
      "updatedAt": "2026-03-07T10:30:00Z",
      "isActive": true
    }
  ],
  "continuationToken": null
}
```

#### 5. Get Scenario
```
GET /api/scenarios/:scenarioId
Auth: Required
Response: 200 OK
{
  "id": "a3f8c2e1-...",
  "name": "Both parents full-time",
  "data": {...},
  "createdAt": "2026-03-01T08:00:00Z",
  "updatedAt": "2026-03-07T10:30:00Z",
  "isActive": true
}

Response: 404 Not Found
{
  "error": "Scenario not found"
}
```

#### 6. Create Scenario
```
POST /api/scenarios
Auth: Required
Body:
{
  "name": "Both parents full-time",
  "data": {...},
  "isActive": true
}
Response: 201 Created
{
  "id": "a3f8c2e1-...",
  "name": "Both parents full-time",
  "createdAt": "2026-03-07T10:30:00Z",
  "updatedAt": "2026-03-07T10:30:00Z"
}
```

#### 7. Update Scenario
```
PUT /api/scenarios/:scenarioId
Auth: Required
Body:
{
  "name": "Both parents full-time",
  "data": {...},
  "isActive": true
}
Response: 200 OK
{
  "id": "a3f8c2e1-...",
  "updatedAt": "2026-03-07T10:30:00Z"
}

Response: 409 Conflict (if stale)
{
  "error": "Conflict detected",
  "serverVersion": {...},
  "clientVersion": {...}
}
```

#### 8. Delete Scenario
```
DELETE /api/scenarios/:scenarioId
Auth: Required
Response: 204 No Content

Response: 404 Not Found
{
  "error": "Scenario not found"
}
```

#### 9. Set Active Scenario
```
POST /api/scenarios/:scenarioId/activate
Auth: Required
Response: 200 OK
{
  "success": true,
  "activeScenarioId": "a3f8c2e1-..."
}
```

### Authentication in Azure Functions

Azure Static Web Apps automatically injects user identity into function requests via headers:

```javascript
const { app } = require('@azure/functions');

app.http('getScenarios', {
    methods: ['GET'],
    authLevel: 'anonymous', // SWA handles auth
    route: 'scenarios',
    handler: async (request, context) => {
        // Get user identity from headers
        const clientPrincipal = request.headers.get('x-ms-client-principal');
        
        if (!clientPrincipal) {
            return {
                status: 401,
                jsonBody: { error: 'Unauthorized' }
            };
        }
        
        // Decode base64 user info
        const userInfo = JSON.parse(
            Buffer.from(clientPrincipal, 'base64').toString('utf-8')
        );
        
        const userId = userInfo.userId;
        
        // Query Table Storage for user's scenarios
        const scenarios = await getScenariosByUser(userId);
        
        return {
            status: 200,
            jsonBody: { scenarios }
        };
    }
});
```

### Error Handling Standards

All API endpoints follow consistent error response format:

```javascript
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {...}, // Optional additional context
  "timestamp": "2026-03-07T10:30:00Z"
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: User doesn't have access to resource
- `NOT_FOUND`: Resource doesn't exist
- `CONFLICT`: Version conflict (stale data)
- `VALIDATION_ERROR`: Invalid input data
- `QUOTA_EXCEEDED`: User has hit storage limits
- `INTERNAL_ERROR`: Server-side error

---

## 6. Frontend Changes

### Storage Layer Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Storage Facade (src/js/storage/storage-manager.js)       │
│  - Unified interface for saving/loading scenarios         │
│  - Automatic fallback: Cloud → LocalStorage               │
│  - Sync conflict resolution                               │
└────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Cloud Storage      │         │  Local Storage      │
│  (authenticated)    │         │  (fallback)         │
└─────────────────────┘         └─────────────────────┘
```

### New File: `src/js/storage/storage-manager.js`

```javascript
/**
 * Storage Manager
 * Unified interface for local and cloud storage
 * Handles fallback, sync, and conflict resolution
 */

import { authManager } from '../auth/auth-manager.js';
import { loadState, saveState } from './persistence.js'; // Existing localStorage
import { debounce } from '../utils/debounce.js';

class StorageManager {
  constructor() {
    this.cloudStorageAvailable = false;
    this.autoSaving = false;
    this.lastSavedState = null;
    this.queuedSave = null;
    
    // Auto-save debounced (3 seconds)
    this.debouncedSave = debounce(
      (state) => this.saveScenario(state),
      3000
    );
  }

  /**
   * Initialize storage manager
   * Checks auth status and cloud availability
   */
  async initialize() {
    const user = await authManager.checkAuth();
    this.cloudStorageAvailable = user !== null;
    
    if (this.cloudStorageAvailable) {
      console.log('Cloud storage available');
      await this.syncWithCloud();
    } else {
      console.log('Using local storage only');
    }
    
    return this.cloudStorageAvailable;
  }

  /**
   * Load active scenario
   * Tries cloud first, falls back to localStorage
   */
  async loadActiveScenario() {
    try {
      if (this.cloudStorageAvailable) {
        const response = await fetch('/api/user/profile', {
          credentials: 'same-origin'
        });
        
        if (response.ok) {
          const profile = await response.json();
          
          if (profile.activeScenarioId) {
            const scenario = await this.loadScenario(profile.activeScenarioId);
            if (scenario) {
              return scenario.data;
            }
          }
        }
      }
      
      // Fallback to localStorage
      return loadState();
    } catch (error) {
      console.error('Error loading scenario:', error);
      return loadState(); // Always fallback to localStorage
    }
  }

  /**
   * Load specific scenario by ID
   */
  async loadScenario(scenarioId) {
    if (!this.cloudStorageAvailable) {
      return null;
    }
    
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Error loading scenario:', error);
      return null;
    }
  }

  /**
   * Save scenario (to both local and cloud if authenticated)
   */
  async saveScenario(state, scenarioName = 'My Scenario') {
    // Always save to localStorage first (instant)
    saveState(state);
    this.lastSavedState = state;
    
    // If authenticated, also save to cloud
    if (this.cloudStorageAvailable) {
      try {
        const profile = await this.getUserProfile();
        const scenarioId = profile.activeScenarioId;
        
        const scenarioData = {
          name: scenarioName,
          data: state,
          isActive: true
        };
        
        let response;
        
        if (scenarioId) {
          // Update existing scenario
          response = await fetch(`/api/scenarios/${scenarioId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(scenarioData)
          });
        } else {
          // Create new scenario
          response = await fetch('/api/scenarios', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(scenarioData)
          });
        }
        
        if (response.ok) {
          const result = await response.json();
          this.updateSyncStatus('synced');
          return result;
        } else if (response.status === 409) {
          // Conflict - handle merge
          const conflict = await response.json();
          await this.handleConflict(conflict);
        }
      } catch (error) {
        console.error('Error saving to cloud:', error);
        this.updateSyncStatus('error');
      }
    }
  }

  /**
   * Auto-save on field changes (debounced)
   */
  autoSave(state) {
    this.updateSyncStatus('saving');
    this.debouncedSave(state);
  }

  /**
   * List all user scenarios
   */
  async listScenarios() {
    if (!this.cloudStorageAvailable) {
      return [];
    }
    
    try {
      const response = await fetch('/api/scenarios', {
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.scenarios;
      }
      
      return [];
    } catch (error) {
      console.error('Error listing scenarios:', error);
      return [];
    }
  }

  /**
   * Delete scenario
   */
  async deleteScenario(scenarioId) {
    if (!this.cloudStorageAvailable) {
      return false;
    }
    
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting scenario:', error);
      return false;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * Sync with cloud after login
   * Merges localStorage data with cloud data
   */
  async syncWithCloud() {
    try {
      // Load local data
      const localState = loadState();
      
      // Load cloud data
      const cloudState = await this.loadActiveScenario();
      
      if (!cloudState && localState) {
        // No cloud data, upload local data
        await this.saveScenario(localState, 'Imported from device');
        this.updateSyncStatus('synced');
      } else if (cloudState && !localState) {
        // No local data, use cloud data
        saveState(cloudState);
        this.updateSyncStatus('synced');
      } else if (cloudState && localState) {
        // Both exist - use most recent
        const localTimestamp = new Date(localState.metadata?.lastModified || 0);
        const cloudTimestamp = new Date(cloudState.metadata?.lastModified || 0);
        
        if (localTimestamp > cloudTimestamp) {
          // Local is newer, upload
          await this.saveScenario(localState, 'Synced from device');
        } else {
          // Cloud is newer, download
          saveState(cloudState);
        }
        
        this.updateSyncStatus('synced');
      }
    } catch (error) {
      console.error('Sync error:', error);
      this.updateSyncStatus('error');
    }
  }

  /**
   * Handle conflict when saving
   */
  async handleConflict(conflict) {
    // For now, server wins
    // Future: Show user conflict resolution UI
    console.warn('Conflict detected, using server version');
    saveState(conflict.serverVersion.data);
    this.updateSyncStatus('conflictResolved');
  }

  /**
   * Update sync status in UI
   */
  updateSyncStatus(status) {
    const syncStatusEl = document.getElementById('sync-status');
    if (!syncStatusEl) return;
    
    const syncIcon = syncStatusEl.querySelector('.sync-icon');
    const syncText = syncStatusEl.querySelector('.sync-text');
    
    switch (status) {
      case 'saving':
        syncIcon.textContent = '⏳';
        syncText.textContent = 'Saving...';
        break;
      case 'synced':
        syncIcon.textContent = '☁️';
        syncText.textContent = 'Synced';
        break;
      case 'error':
        syncIcon.textContent = '⚠️';
        syncText.textContent = 'Sync failed';
        break;
      case 'conflictResolved':
        syncIcon.textContent = '🔄';
        syncText.textContent = 'Conflict resolved';
        break;
    }
  }
}

// Singleton instance
export const storageManager = new StorageManager();
```

### Integration with Form Handler

Update `src/js/ui/form-handler.js` to use new storage manager:

```javascript
import { storageManager } from '../storage/storage-manager.js';

// In form input event listener
formElement.addEventListener('input', (e) => {
  // Existing validation code...
  
  // Auto-save on change (debounced)
  const currentState = getCurrentFormState();
  storageManager.autoSave(currentState);
});

// In form blur event listener
formElement.addEventListener('blur', (e) => {
  // Existing validation code...
  
  // Trigger save on blur (useful for important fields)
  const currentState = getCurrentFormState();
  storageManager.autoSave(currentState);
}, true);
```

### UI for Scenario Management

Add scenario management panel (future phase):

```html
<!-- Scenario Management Panel -->
<div id="scenarios-panel" class="scenarios-panel" hidden>
  <h3>My Scenarios</h3>
  <button type="button" id="btn-new-scenario" class="btn-new-scenario">
    ➕ New Scenario
  </button>
  <ul id="scenarios-list" class="scenarios-list">
    <!-- Populated dynamically -->
  </ul>
</div>
```

---

## 7. Security & Privacy

### Security Measures

1. **Authentication**
   - Azure SWA built-in OAuth (industry standard)
   - HTTPS-only (enforced by Azure)
   - Secure session cookies (HttpOnly, Secure, SameSite)

2. **Authorization**
   - User can only access their own scenarios
   - userId validated on every API call
   - No role-based access needed (single user per account)

3. **Data Protection**
   - Data encrypted in transit (HTTPS/TLS 1.2+)
   - Data encrypted at rest in Azure Storage
   - No sensitive financial data stored (only calculator inputs)

4. **API Security**
   - Rate limiting via Azure API Management (if needed)
   - Input validation on all endpoints
   - SQL injection not applicable (NoSQL)
   - XSS protection via CSP headers (already configured)

5. **Storage Security**
   - Table Storage access via connection string (secured in Functions)
   - No direct client access to storage
   - Partition key = userId (automatic data isolation)

### Privacy Considerations

1. **Data Collected**
   - User email (from auth provider)
   - Calculator form inputs (income, children, fees)
   - Scenario names and timestamps
   - User preferences (theme, period selection)

2. **Data NOT Collected**
   - No tracking cookies
   - No analytics (unless explicitly added later with consent)
   - No third-party integrations
   - No selling of data

3. **User Rights**
   - **Access**: Users can view all their scenarios
   - **Modification**: Users can edit/delete scenarios
   - **Export**: Users can export data (CSV already implemented)
   - **Deletion**: Users can delete account and all data
   - **Portability**: JSON export for data portability

4. **Privacy Policy Updates**
   - Add privacy policy page explaining data collection
   - Add cookie notice (for auth session cookies)
   - Add data deletion instructions
   - Comply with GDPR/Australian Privacy Principles

### Compliance

**Australian Privacy Principles (APPs)**:
- ✅ APP 1: Open and transparent management of personal information
- ✅ APP 3: Collection of solicited personal information (only what's needed)
- ✅ APP 5: Notification of collection
- ✅ APP 6: Use or disclosure of personal information (only for calculator)
- ✅ APP 11: Security of personal information
- ✅ APP 12: Access to personal information
- ✅ APP 13: Correction of personal information

---

## 8. Azure Infrastructure Setup

### Prerequisites

- Azure CLI installed (`az` command)
- Azure subscription with appropriate permissions
- Resource group created

### Step 1: Install Azure CLI (if not installed)

```bash
# Check if Azure CLI is installed
az --version

# If not installed:
# macOS
brew install azure-cli

# Ubuntu/Debian
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Windows
# Download installer from: https://aka.ms/installazurecliwindows
```

### Step 2: Login to Azure

```bash
# Login interactively
az login

# Set subscription (replace with your subscription ID)
az account set --subscription "your-subscription-id"

# Verify
az account show
```

### Step 3: Create Resource Group

```bash
# Variables
RESOURCE_GROUP="rg-ccs-calculator"
LOCATION="australiaeast"  # Or closest Azure region

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### Step 4: Create Storage Account

```bash
# Variables
STORAGE_ACCOUNT="stccscalc$(openssl rand -hex 4)"  # Add random suffix for uniqueness
STORAGE_SKU="Standard_LRS"  # Locally-redundant storage (cheapest)

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

echo "Storage Connection String: $STORAGE_CONNECTION_STRING"
```

### Step 5: Create Table Storage Tables

```bash
# Create UserScenarios table
az storage table create \
  --name userscenarios \
  --connection-string "$STORAGE_CONNECTION_STRING"

# Create UserProfiles table
az storage table create \
  --name userprofiles \
  --connection-string "$STORAGE_CONNECTION_STRING"

# Verify tables created
az storage table list \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --output table
```

### Step 6: Create Static Web App (if not already created)

```bash
# Variables
SWA_NAME="swa-ccs-calculator"
GITHUB_REPO="https://github.com/richardthorek/CCS-Calculator"
GITHUB_BRANCH="main"

# Create Static Web App
# Note: This requires GitHub authentication
az staticwebapp create \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source $GITHUB_REPO \
  --branch $GITHUB_BRANCH \
  --app-location "/src" \
  --api-location "/api" \
  --output-location "" \
  --login-with-github

# Get deployment token (for GitHub Actions)
SWA_DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name $SWA_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.apiKey \
  --output tsv)

echo "Static Web App Deployment Token: $SWA_DEPLOYMENT_TOKEN"
```

### Step 7: Configure Authentication Providers

```bash
# Azure SWA authentication is configured via staticwebapp.config.json
# No CLI commands needed, but you need to register apps with providers

# Azure SWA built-in auth supports ONLY Microsoft and GitHub

# For Microsoft OAuth (Entra ID/Azure AD):
# 1. Go to https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
# 2. Register new application
# 3. Add redirect URI: https://<your-swa-url>/.auth/login/aad/callback

# For GitHub OAuth:
# 1. Go to https://github.com/settings/developers
# 2. Create OAuth App
# 3. Set callback URL: https://<your-swa-url>/.auth/login/github/callback
```

### Step 8: Configure Application Settings

```bash
# Add storage connection string to Static Web App configuration
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

### Step 9: Update staticwebapp.config.json

```json
{
  "routes": [
    {
      "route": "/.auth/login/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/api/health",
      "allowedRoles": ["anonymous"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,js,png,jpg,jpeg,gif,svg,ico}"]
  },
  "responseOverrides": {
    "401": {
      "statusCode": 302,
      "redirect": "/.auth/login/google"
    },
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.authentication.azure.net; object-src 'none'; base-uri 'self'; form-action 'self';"
  },
  "auth": {
    "identityProviders": {
      "customOpenIdConnectProviders": {}
    }
  },
  "mimeTypes": {
    ".json": "application/json"
  }
}
```

### Step 10: Setup Complete - Summary

```bash
# Save these values for your .env file or documentation
echo "=== Azure Configuration Summary ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Static Web App: $SWA_NAME"
echo ""
echo "=== Connection Strings (KEEP SECURE) ==="
echo "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION_STRING"
echo ""
echo "=== Next Steps ==="
echo "1. Add AZURE_STORAGE_CONNECTION_STRING to GitHub Secrets"
echo "2. Configure OAuth providers (Google, Microsoft, GitHub)"
echo "3. Update staticwebapp.config.json with auth routes"
echo "4. Deploy updated code to Azure"
```

### Cost Estimation

**Monthly costs for 1,000 active users**:

| Service | Usage | Cost |
|---------|-------|------|
| Static Web App | 100 GB bandwidth | Free tier |
| Azure Functions | 100K executions | Free tier |
| Table Storage | 5 GB data | $0.25 |
| Table Storage | 100K transactions | $0.01 |
| **Total** | | **~$0.26/month** |

**Monthly costs for 10,000 active users**:

| Service | Usage | Cost |
|---------|-------|------|
| Static Web App | 1 TB bandwidth | $15 |
| Azure Functions | 1M executions | Free tier |
| Table Storage | 50 GB data | $2.50 |
| Table Storage | 1M transactions | $0.10 |
| **Total** | | **~$17.60/month** |

---

## 9. Implementation Plan

### Phase 1: Infrastructure Setup ✅ (Complete after CLI commands)
- [x] Create Azure storage account
- [x] Create Table Storage tables
- [x] Configure Static Web App settings
- [x] Set up OAuth providers

### Phase 2: Backend API (2-3 days)
- [ ] Install Azure Storage SDK in api/package.json
- [ ] Create Table Storage service module
- [ ] Implement user profile endpoints
- [ ] Implement scenario CRUD endpoints
- [ ] Add error handling and logging
- [ ] Write unit tests for API functions

**Files to create/modify**:
- `api/package.json` - Add @azure/data-tables dependency
- `api/src/services/table-storage.js` - Table Storage service
- `api/src/services/user-profile.js` - User profile logic
- `api/src/services/scenarios.js` - Scenario management logic
- `api/src/functions/user-profile.js` - User profile endpoints
- `api/src/functions/scenarios.js` - Scenario endpoints
- `api/src/utils/auth.js` - Auth helper functions
- `api/tests/` - Unit tests

### Phase 3: Frontend Authentication (1-2 days)
- [ ] Create auth-manager.js module
- [ ] Add authentication UI components to index.html
- [ ] Add CSS styling for auth UI
- [ ] Integrate auth check on app load
- [ ] Add login/logout button handlers
- [ ] Test OAuth flow with multiple providers

**Files to create/modify**:
- `src/js/auth/auth-manager.js` - Auth manager module
- `src/index.html` - Add auth UI
- `src/styles.css` - Add auth styling
- `src/app.js` - Initialize auth on load
- `src/js/ui/auth-ui.js` - Auth UI controller

### Phase 4: Frontend Storage Manager (2-3 days)
- [ ] Create storage-manager.js module
- [ ] Implement cloud storage API calls
- [ ] Implement sync logic
- [ ] Add conflict resolution
- [ ] Update form-handler.js for auto-save
- [ ] Add sync status UI
- [ ] Test offline/online scenarios

**Files to create/modify**:
- `src/js/storage/storage-manager.js` - Storage manager
- `src/js/ui/form-handler.js` - Add auto-save hooks
- `src/js/ui/sync-status.js` - Sync status UI
- `src/index.html` - Add sync status indicator
- `src/styles.css` - Sync status styling

### Phase 5: Testing & Polish (2-3 days)
- [ ] Write integration tests
- [ ] Test authentication flow
- [ ] Test auto-save functionality
- [ ] Test sync after login
- [ ] Test conflict scenarios
- [ ] Test error handling
- [ ] Performance testing
- [ ] Browser compatibility testing

### Phase 6: Documentation & Privacy (1 day)
- [ ] Update README.md with authentication info
- [ ] Create privacy policy page
- [ ] Add data deletion instructions
- [ ] Document API endpoints
- [ ] Create user guide for scenarios
- [ ] Update master-plan.md

### Phase 7: Deployment (1 day)
- [ ] Update GitHub Actions workflow
- [ ] Deploy to Azure Static Web App
- [ ] Configure custom domain (if applicable)
- [ ] Set up monitoring and alerts
- [ ] Perform smoke tests
- [ ] Announce feature to users

**Total estimated time**: 2-3 weeks

---

## 10. Testing Strategy

### Unit Tests

**Backend (Azure Functions)**:
```javascript
// Example: tests/api/scenarios.test.js
describe('Scenario API', () => {
  it('should create a new scenario', async () => {
    const scenario = await createScenario(userId, scenarioData);
    expect(scenario.id).toBeDefined();
  });
  
  it('should reject unauthorized access', async () => {
    const response = await request(app)
      .get('/api/scenarios')
      .expect(401);
  });
});
```

**Frontend (Storage Manager)**:
```javascript
// Example: tests/storage/storage-manager.test.js
describe('StorageManager', () => {
  it('should fallback to localStorage when offline', async () => {
    storageManager.cloudStorageAvailable = false;
    await storageManager.saveScenario(testState);
    const loaded = await storageManager.loadActiveScenario();
    expect(loaded).toEqual(testState);
  });
});
```

### Integration Tests

1. **Authentication Flow**:
   - User logs in with Google
   - User identity is retrieved
   - User can access protected endpoints
   - User logs out successfully

2. **Scenario Lifecycle**:
   - Create new scenario
   - Load scenario
   - Update scenario (auto-save)
   - Delete scenario
   - List all scenarios

3. **Sync Flow**:
   - User logs in with local data
   - Local data syncs to cloud
   - User logs in from different device
   - Cloud data loads correctly

4. **Conflict Resolution**:
   - User edits on Device A
   - User edits same scenario on Device B
   - Conflict detected and resolved

### Manual Testing Checklist

- [ ] Sign in with Google
- [ ] Sign in with Microsoft
- [ ] Sign in with GitHub
- [ ] Input calculator data
- [ ] Auto-save triggers on field change
- [ ] Sync status updates correctly
- [ ] Log out and log back in (data persists)
- [ ] Open calculator on different device (data syncs)
- [ ] Edit while offline (saves to localStorage)
- [ ] Go back online (syncs to cloud)
- [ ] Delete scenario
- [ ] Create multiple scenarios (future)

### Performance Testing

- [ ] Measure API response times (< 200ms target)
- [ ] Measure auto-save latency (< 3s after last change)
- [ ] Test with 100 scenarios per user
- [ ] Test concurrent edits from multiple tabs
- [ ] Load test with 100 concurrent users

---

## 11. Migration Strategy

### Existing Users (localStorage)

When authentication is introduced, existing users have data in localStorage only.

**Migration Flow**:

1. User visits site (not logged in)
2. Calculator works normally with localStorage
3. User sees prompt: "Sign in to save your scenarios"
4. User decides to sign in
5. On successful login:
   - System checks for localStorage data
   - If found, prompts: "Import your existing scenario to the cloud?"
   - If user accepts, uploads localStorage data as first scenario
   - User can now access from any device

**Code** (in storage-manager.js):

```javascript
async syncWithCloud() {
  const localState = loadState();
  
  if (localState && !localState.hasBeenSynced) {
    const shouldImport = confirm(
      'Import your existing scenario to the cloud?\n' +
      'This will allow you to access it from any device.'
    );
    
    if (shouldImport) {
      await this.saveScenario(localState, 'Imported from device');
      
      // Mark as synced to avoid re-prompting
      localState.hasBeenSynced = true;
      saveState(localState);
    }
  }
}
```

### Backward Compatibility

- localStorage code remains functional
- App works without authentication
- Progressive enhancement approach
- No breaking changes for existing users

---

## Conclusion

This design provides a comprehensive roadmap for adding user authentication and cloud storage to the CCS Calculator while maintaining the project's vanilla JavaScript philosophy and progressive enhancement approach.

**Key Benefits**:
- ✅ Users can access scenarios from any device
- ✅ Data persists across browser sessions
- ✅ Multiple scenarios supported (future)
- ✅ No data loss from clearing browser cache
- ✅ Maintains privacy-first approach
- ✅ Cost-effective (~$17/month for 10K users)
- ✅ Scalable to millions of users

**Next Steps**:
1. Run Azure CLI commands to provision infrastructure
2. Begin Phase 2 implementation (Backend API)
3. Add tasks to master-plan.md
4. Start with authentication module

---

## Appendix A: Azure Table Storage Client Examples

### Installing SDK

```bash
cd api
npm install @azure/data-tables
```

### Basic Usage

```javascript
const { TableClient } = require('@azure/data-tables');

// Initialize client
const tableClient = TableClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING,
  'userscenarios'
);

// Create entity
async function createScenario(userId, scenarioData) {
  const entity = {
    partitionKey: userId,
    rowKey: generateGuid(),
    scenarioName: scenarioData.name,
    scenarioData: JSON.stringify(scenarioData.data),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  };
  
  await tableClient.createEntity(entity);
  return entity;
}

// Get entity
async function getScenario(userId, scenarioId) {
  const entity = await tableClient.getEntity(userId, scenarioId);
  return {
    id: entity.rowKey,
    name: entity.scenarioName,
    data: JSON.parse(entity.scenarioData),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    isActive: entity.isActive
  };
}

// Update entity
async function updateScenario(userId, scenarioId, updates) {
  const entity = await tableClient.getEntity(userId, scenarioId);
  
  entity.scenarioData = JSON.stringify(updates.data);
  entity.updatedAt = new Date().toISOString();
  entity.isActive = updates.isActive;
  
  await tableClient.updateEntity(entity, 'Merge');
  return entity;
}

// Delete entity
async function deleteScenario(userId, scenarioId) {
  await tableClient.deleteEntity(userId, scenarioId);
}

// List entities (all scenarios for user)
async function listUserScenarios(userId) {
  const scenarios = [];
  const entities = tableClient.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` }
  });
  
  for await (const entity of entities) {
    scenarios.push({
      id: entity.rowKey,
      name: entity.scenarioName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      isActive: entity.isActive
    });
  }
  
  return scenarios;
}
```

---

## Appendix B: Complete CLI Setup Script

```bash
#!/bin/bash
#
# Azure Infrastructure Setup Script for CCS Calculator
# Provisions all required Azure resources for authentication and storage
#

set -e  # Exit on error

echo "=== CCS Calculator - Azure Infrastructure Setup ==="
echo ""

# Configuration
RESOURCE_GROUP="rg-ccs-calculator"
LOCATION="australiaeast"
STORAGE_ACCOUNT="stccscalc$(openssl rand -hex 4)"
STORAGE_SKU="Standard_LRS"
SWA_NAME="swa-ccs-calculator"

echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Storage Account: $STORAGE_ACCOUNT"
echo ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "✅ Azure CLI found"

# Login check
echo "Checking Azure login..."
if ! az account show &> /dev/null; then
    echo "Please log in to Azure..."
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "✅ Logged in to subscription: $SUBSCRIPTION_ID"
echo ""

# Create resource group
echo "Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --output none

echo "✅ Resource group created"

# Create storage account
echo "Creating storage account..."
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

echo "✅ Storage account created"

# Get connection string
echo "Retrieving connection string..."
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv)

echo "✅ Connection string retrieved"

# Create tables
echo "Creating Table Storage tables..."
az storage table create \
  --name userscenarios \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --output none

az storage table create \
  --name userprofiles \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --output none

echo "✅ Tables created"

# Verify
echo ""
echo "Verifying tables..."
az storage table list \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --output table

echo ""
echo "=== Setup Complete ✅ ==="
echo ""
echo "📋 Configuration Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Resource Group:    $RESOURCE_GROUP"
echo "Storage Account:   $STORAGE_ACCOUNT"
echo "Location:          $LOCATION"
echo "Tables:            userscenarios, userprofiles"
echo ""
echo "🔐 Connection String (KEEP SECURE):"
echo "$STORAGE_CONNECTION_STRING"
echo ""
echo "📝 Next Steps:"
echo "1. Add connection string to Azure Static Web App settings:"
echo "   az staticwebapp appsettings set \\"
echo "     --name $SWA_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --setting-names AZURE_STORAGE_CONNECTION_STRING='$STORAGE_CONNECTION_STRING'"
echo ""
echo "2. Configure OAuth providers for Azure Static Web App"
echo "3. Update staticwebapp.config.json with authentication routes"
echo "4. Deploy backend API with Azure Storage SDK"
echo ""
echo "💡 Save this output for your records!"
```

**To run**:
```bash
chmod +x setup-azure.sh
./setup-azure.sh
```

---

**Document End**
