'use strict';

/**
 * User Profile API Endpoints
 *
 * Routes:
 *   GET  /api/user/profile  – retrieve the authenticated user's profile
 *   PUT  /api/user/profile  – update the authenticated user's preferences
 *
 * Authentication:
 *   All routes require the Azure SWA 'x-ms-client-principal' header.
 *   The authLevel is 'anonymous' because Azure Static Web Apps enforces
 *   authentication at the gateway level (see staticwebapp.config.json).
 */

const { app } = require('@azure/functions');
const { requireAuth, buildErrorBody } = require('../utils/auth');
const { createUserProfileService } = require('../services/user-profile');
const { createTableStorageService } = require('../services/table-storage');

// Shared service instances (reused across warm invocations)
let _storageService = null;
let _profileService = null;

function getServices() {
    if (!_storageService) {
        _storageService = createTableStorageService();
    }
    if (!_profileService) {
        _profileService = createUserProfileService(_storageService);
    }
    return _profileService;
}

// ---------------------------------------------------------------------------
// GET /api/user/profile
// ---------------------------------------------------------------------------
app.http('getUserProfile', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'user/profile',
    handler: async (request, context) => {
        context.log('GET /api/user/profile');

        let user;
        try {
            user = requireAuth(request);
        } catch (err) {
            return { status: err.status || 401, jsonBody: err.body };
        }

        try {
            const profileService = getServices();
            let profile = await profileService.getUserProfile(user.userId);

            if (!profile) {
                // Auto-provision profile on first access
                profile = await profileService.createUserProfile(user.userId, {
                    email: user.email,
                    displayName: user.email
                });
            }

            return { status: 200, jsonBody: profile };
        } catch (err) {
            context.log.error('Error retrieving user profile:', err);
            return {
                status: 500,
                jsonBody: buildErrorBody('Internal server error', 'INTERNAL_ERROR')
            };
        }
    }
});

// ---------------------------------------------------------------------------
// PUT /api/user/profile
// ---------------------------------------------------------------------------
app.http('updateUserProfile', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'user/profile',
    handler: async (request, context) => {
        context.log('PUT /api/user/profile');

        let user;
        try {
            user = requireAuth(request);
        } catch (err) {
            return { status: err.status || 401, jsonBody: err.body };
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return {
                status: 400,
                jsonBody: buildErrorBody('Invalid JSON body', 'VALIDATION_ERROR')
            };
        }

        // Only allow updating known fields
        const updates = {};
        if (body.preferences !== undefined) {
            updates.preferences =
                typeof body.preferences === 'string'
                    ? body.preferences
                    : JSON.stringify(body.preferences);
        }
        if (body.activeScenarioId !== undefined) {
            updates.activeScenarioId = String(body.activeScenarioId);
        }
        if (body.displayName !== undefined) {
            updates.displayName = String(body.displayName).slice(0, 200);
        }

        try {
            const profileService = getServices();
            const profile = await profileService.updateUserProfile(user.userId, updates);
            return {
                status: 200,
                jsonBody: { success: true, profile }
            };
        } catch (err) {
            context.log.error('Error updating user profile:', err);
            return {
                status: 500,
                jsonBody: buildErrorBody('Internal server error', 'INTERNAL_ERROR')
            };
        }
    }
});
