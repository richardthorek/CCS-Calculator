'use strict';

/**
 * Authentication utilities for Azure Static Web Apps
 *
 * Azure SWA injects the authenticated user identity into every function
 * request via the 'x-ms-client-principal' header (base64-encoded JSON).
 *
 * @see https://docs.microsoft.com/en-us/azure/static-web-apps/user-information?tabs=javascript#api-functions
 */

/**
 * Extract authenticated user from a request.
 *
 * @param {import('@azure/functions').HttpRequest} request - Azure Functions HTTP request
 * @returns {{ userId: string, email: string, provider: string, roles: string[] } | null}
 *   Parsed user object, or null if no valid principal is present.
 */
function extractUserFromRequest(request) {
    const principalHeader = request.headers.get('x-ms-client-principal');

    if (!principalHeader) {
        return null;
    }

    try {
        const decoded = Buffer.from(principalHeader, 'base64').toString('utf-8');
        const principal = JSON.parse(decoded);

        if (!principal || !principal.userId) {
            return null;
        }

        return {
            userId: principal.userId,
            email: principal.userDetails || '',
            provider: principal.identityProvider || '',
            roles: Array.isArray(principal.userRoles) ? principal.userRoles : []
        };
    } catch {
        return null;
    }
}

/**
 * Require an authenticated user, throwing a structured error if absent.
 *
 * @param {import('@azure/functions').HttpRequest} request - Azure Functions HTTP request
 * @returns {{ userId: string, email: string, provider: string, roles: string[] }}
 *   Parsed user object.
 * @throws {{ status: number, body: object }} When the request is unauthenticated.
 */
function requireAuth(request) {
    const user = extractUserFromRequest(request);

    if (!user) {
        const err = new Error('Unauthorized');
        err.status = 401;
        err.body = {
            error: 'Unauthorized',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString()
        };
        throw err;
    }

    return user;
}

/**
 * Build a standardised error response body.
 *
 * @param {string} message - Human-readable message
 * @param {string} code    - Machine-readable error code
 * @param {object} [details] - Optional extra context
 * @returns {object}
 */
function buildErrorBody(message, code, details) {
    const body = {
        error: message,
        code,
        timestamp: new Date().toISOString()
    };
    if (details !== undefined) {
        body.details = details;
    }
    return body;
}

module.exports = { extractUserFromRequest, requireAuth, buildErrorBody };
