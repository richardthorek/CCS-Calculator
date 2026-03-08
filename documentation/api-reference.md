# API Reference

**Version:** 1.0  
**Base URL:** `/api`  
**Last Updated:** March 2026

## Overview

All endpoints (except the health check) require authentication via Azure Static Web App's
built-in OAuth. The SWA gateway injects the authenticated user identity as an
`x-ms-client-principal` header (base64-encoded JSON) into every function invocation.

---

## Authentication

Azure SWA handles the OAuth flow transparently. When a user is authenticated the gateway
attaches:

```
x-ms-client-principal: <base64-encoded JSON>
```

Decoded value example:

```json
{
  "userId": "d75b260a64504067bfc5b2905e3b8182",
  "userRoles": ["anonymous", "authenticated"],
  "identityProvider": "google",
  "userDetails": "user@example.com"
}
```

Unauthenticated requests return `401 Unauthorized`.

---

## Error Response Format

All error responses use a consistent shape:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "timestamp": "2026-03-08T00:00:00.000Z",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User does not own the resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | ETag/version conflict (stale data) |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### Health Check

#### `GET /api/health`

Returns the service health status. **No authentication required.**

**Response – 200 OK**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-08T00:00:00.000Z",
  "service": "CCS Calculator API"
}
```

**cURL example**
```bash
curl https://<your-app>.azurestaticapps.net/api/health
```

---

### User Profile

#### `GET /api/user/profile`

Retrieve the authenticated user's profile. Creates a default profile on first call.

**Response – 200 OK**
```json
{
  "userId": "d75b260a64504067bfc5b2905e3b8182",
  "email": "user@example.com",
  "displayName": "user@example.com",
  "preferences": {
    "theme": "light",
    "defaultPeriod": "fortnightly"
  },
  "lastSyncTimestamp": "2026-03-08T10:30:00.000Z",
  "activeScenarioId": "a3f8c2e1-4b5d-6789-0abc-def123456789",
  "createdAt": "2026-02-15T12:00:00.000Z"
}
```

**cURL example**
```bash
curl -H "x-ms-client-principal: <base64-token>" \
  https://<your-app>.azurestaticapps.net/api/user/profile
```

---

#### `PUT /api/user/profile`

Update mutable profile fields. Creates the profile if it does not exist.

**Request Body** (all fields optional)
```json
{
  "preferences": {
    "theme": "dark",
    "defaultPeriod": "weekly"
  },
  "displayName": "Jane Smith",
  "activeScenarioId": "a3f8c2e1-4b5d-6789-0abc-def123456789"
}
```

> `preferences` can be supplied as an object or a pre-serialised JSON string.

**Response – 200 OK**
```json
{
  "success": true,
  "profile": { ... }
}
```

**cURL example**
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "x-ms-client-principal: <base64-token>" \
  -d '{"preferences":{"theme":"dark"}}' \
  https://<your-app>.azurestaticapps.net/api/user/profile
```

---

### Scenarios

#### `GET /api/scenarios`

List all scenarios for the authenticated user (summary only, no `data` blob).

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Maximum results per page (max 100) |
| `continuationToken` | string | – | Pagination token from previous response |

**Response – 200 OK**
```json
{
  "scenarios": [
    {
      "id": "a3f8c2e1-4b5d-6789-0abc-def123456789",
      "name": "Both parents full-time",
      "createdAt": "2026-03-01T08:00:00.000Z",
      "updatedAt": "2026-03-07T10:30:00.000Z",
      "isActive": true,
      "tags": "fulltime,dual-income"
    }
  ],
  "continuationToken": null
}
```

**cURL example**
```bash
curl -H "x-ms-client-principal: <base64-token>" \
  "https://<your-app>.azurestaticapps.net/api/scenarios?limit=20"
```

---

#### `POST /api/scenarios`

Create a new scenario.

**Request Body**
```json
{
  "name": "Both parents full-time",
  "data": {
    "parent1Income": 85000,
    "parent2Income": 72000,
    "children": [{ "age": 3, "daysInCare": 5, "dailyFee": 145 }]
  },
  "isActive": true,
  "tags": "fulltime"
}
```

**Validation**
- `name` is required, must be non-empty, max 200 characters

**Response – 201 Created**
```json
{
  "id": "a3f8c2e1-4b5d-6789-0abc-def123456789",
  "name": "Both parents full-time",
  "data": { ... },
  "version": 1,
  "createdAt": "2026-03-08T10:30:00.000Z",
  "updatedAt": "2026-03-08T10:30:00.000Z",
  "isActive": true,
  "tags": "fulltime",
  "etag": "W/\"datetime'2026-03-08...'\"" 
}
```

**cURL example**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-ms-client-principal: <base64-token>" \
  -d '{"name":"Test","data":{},"isActive":true}' \
  https://<your-app>.azurestaticapps.net/api/scenarios
```

---

#### `GET /api/scenarios/{id}`

Retrieve a single scenario including its full `data` blob.

**Response – 200 OK**
```json
{
  "id": "a3f8c2e1-4b5d-6789-0abc-def123456789",
  "name": "Both parents full-time",
  "data": { ... },
  "version": 1,
  "createdAt": "2026-03-01T08:00:00.000Z",
  "updatedAt": "2026-03-07T10:30:00.000Z",
  "isActive": true,
  "tags": "",
  "etag": "W/\"datetime'2026-03-07...'\""
}
```

**Response – 404 Not Found**
```json
{ "error": "Scenario not found", "code": "NOT_FOUND", "timestamp": "..." }
```

---

#### `PUT /api/scenarios/{id}`

Update an existing scenario. Supports **ETag-based optimistic concurrency**.

Supply either:
- An `If-Match` HTTP header with the current ETag, **or**
- A `etag` field in the request body

When an ETag is provided and the server version has changed, a `409 Conflict` is returned
containing the current server version so the client can perform a merge.

**Request Body** (all fields optional)
```json
{
  "name": "Updated Name",
  "data": { ... },
  "isActive": false,
  "etag": "W/\"datetime'2026-03-07...'\""
}
```

**Response – 200 OK**
```json
{
  "id": "a3f8c2e1-4b5d-6789-0abc-def123456789",
  "updatedAt": "2026-03-08T11:00:00.000Z"
}
```

**Response – 409 Conflict**
```json
{
  "error": "Conflict detected",
  "code": "CONFLICT",
  "serverVersion": {
    "id": "a3f8c2e1-...",
    "name": "Server Name",
    "data": { ... },
    "updatedAt": "2026-03-08T10:50:00.000Z"
  },
  "timestamp": "..."
}
```

**cURL example (with If-Match header)**
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "x-ms-client-principal: <base64-token>" \
  -H 'If-Match: W/"datetime'"'"'2026-03-07...'"'"'"' \
  -d '{"name":"Updated"}' \
  https://<your-app>.azurestaticapps.net/api/scenarios/a3f8c2e1-...
```

---

#### `DELETE /api/scenarios/{id}`

Delete a scenario permanently.

**Response – 204 No Content** (success, no body)

**Response – 404 Not Found**
```json
{ "error": "Scenario not found", "code": "NOT_FOUND", "timestamp": "..." }
```

**cURL example**
```bash
curl -X DELETE \
  -H "x-ms-client-principal: <base64-token>" \
  https://<your-app>.azurestaticapps.net/api/scenarios/a3f8c2e1-...
```

---

#### `POST /api/scenarios/{id}/activate`

Set a scenario as the user's active scenario. All other scenarios are deactivated.
Also updates `activeScenarioId` on the user profile.

**Response – 200 OK**
```json
{
  "success": true,
  "activeScenarioId": "a3f8c2e1-4b5d-6789-0abc-def123456789"
}
```

**Response – 404 Not Found**
```json
{ "error": "Scenario not found", "code": "NOT_FOUND", "timestamp": "..." }
```

**cURL example**
```bash
curl -X POST \
  -H "x-ms-client-principal: <base64-token>" \
  https://<your-app>.azurestaticapps.net/api/scenarios/a3f8c2e1-.../activate
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_STORAGE_CONNECTION_STRING` | Yes | Connection string for the Azure Storage account |
| `TABLE_NAME_SCENARIOS` | No | Table name for scenarios (default: `userscenarios`) |
| `TABLE_NAME_PROFILES` | No | Table name for profiles (default: `userprofiles`) |

---

## Data Model

### UserProfile

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | User ID from authentication provider |
| `email` | string | User email from OAuth provider |
| `displayName` | string | User display name (max 200 chars) |
| `preferences` | object | User preferences (theme, defaultPeriod, etc.) |
| `lastSyncTimestamp` | ISO 8601 | Last sync time |
| `activeScenarioId` | string | Currently active scenario ID |
| `createdAt` | ISO 8601 | Profile creation time |

### Scenario

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique scenario identifier |
| `name` | string | User-friendly name (max 200 chars) |
| `data` | object | Full calculator state JSON |
| `version` | number | Schema version (for future migrations) |
| `isActive` | boolean | Whether this is the user's active scenario |
| `tags` | string | Comma-separated tags |
| `createdAt` | ISO 8601 | Creation time |
| `updatedAt` | ISO 8601 | Last modification time |
| `etag` | string | ETag for optimistic concurrency control |
