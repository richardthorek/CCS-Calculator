'use strict';

/**
 * Scenarios API Endpoints
 *
 * Routes:
 *   GET    /api/scenarios              – list user's scenarios
 *   POST   /api/scenarios              – create a new scenario
 *   GET    /api/scenarios/{id}         – get a specific scenario
 *   PUT    /api/scenarios/{id}         – update a scenario (ETag conflict detection)
 *   DELETE /api/scenarios/{id}         – delete a scenario
 *   POST   /api/scenarios/{id}/activate – set as the active scenario
 *
 * Authentication:
 *   All routes require the Azure SWA 'x-ms-client-principal' header.
 */

const { app } = require('@azure/functions');
const { requireAuth, buildErrorBody } = require('../utils/auth');
const { createScenariosService } = require('../services/scenarios');
const { createUserProfileService } = require('../services/user-profile');
const { createTableStorageService } = require('../services/table-storage');

// Shared service instances
let _storageService = null;
let _scenariosService = null;
let _profileService = null;

function getScenarioService() {
    if (!_storageService) {
        _storageService = createTableStorageService();
    }
    if (!_scenariosService) {
        _scenariosService = createScenariosService(_storageService);
    }
    return _scenariosService;
}

function getProfileService() {
    if (!_storageService) {
        _storageService = createTableStorageService();
    }
    if (!_profileService) {
        _profileService = createUserProfileService(_storageService);
    }
    return _profileService;
}

// ---------------------------------------------------------------------------
// GET /api/scenarios
// ---------------------------------------------------------------------------
app.http('listScenarios', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'scenarios',
    handler: async (request, context) => {
        context.log('GET /api/scenarios');

        let user;
        try {
            user = requireAuth(request);
        } catch (err) {
            return { status: err.status || 401, jsonBody: err.body };
        }

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '100', 10);
        const continuationToken = url.searchParams.get('continuationToken') || undefined;

        try {
            const service = getScenarioService();
            const result = await service.getUserScenarios(user.userId, {
                limit,
                continuationToken
            });
            return { status: 200, jsonBody: result };
        } catch (err) {
            context.log.error('Error listing scenarios:', err);
            return {
                status: 500,
                jsonBody: buildErrorBody('Internal server error', 'INTERNAL_ERROR')
            };
        }
    }
});

// ---------------------------------------------------------------------------
// POST /api/scenarios
// ---------------------------------------------------------------------------
app.http('createScenario', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'scenarios',
    handler: async (request, context) => {
        context.log('POST /api/scenarios');

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

        try {
            const service = getScenarioService();
            const scenario = await service.createScenario(user.userId, body);
            return { status: 201, jsonBody: scenario };
        } catch (err) {
            if (err.validationError) {
                return {
                    status: 400,
                    jsonBody: buildErrorBody(err.message, 'VALIDATION_ERROR')
                };
            }
            context.log.error('Error creating scenario:', err);
            return {
                status: 500,
                jsonBody: buildErrorBody('Internal server error', 'INTERNAL_ERROR')
            };
        }
    }
});

// ---------------------------------------------------------------------------
// GET /api/scenarios/{id}
// ---------------------------------------------------------------------------
app.http('getScenario', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'scenarios/{id}',
    handler: async (request, context) => {
        const scenarioId = request.params.id;
        context.log(`GET /api/scenarios/${scenarioId}`);

        let user;
        try {
            user = requireAuth(request);
        } catch (err) {
            return { status: err.status || 401, jsonBody: err.body };
        }

        try {
            const service = getScenarioService();
            const scenario = await service.getScenario(user.userId, scenarioId);

            if (!scenario) {
                return {
                    status: 404,
                    jsonBody: buildErrorBody('Scenario not found', 'NOT_FOUND')
                };
            }

            return { status: 200, jsonBody: scenario };
        } catch (err) {
            context.log.error('Error retrieving scenario:', err);
            return {
                status: 500,
                jsonBody: buildErrorBody('Internal server error', 'INTERNAL_ERROR')
            };
        }
    }
});

// ---------------------------------------------------------------------------
// PUT /api/scenarios/{id}
// ---------------------------------------------------------------------------
app.http('updateScenario', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'scenarios/{id}',
    handler: async (request, context) => {
        const scenarioId = request.params.id;
        context.log(`PUT /api/scenarios/${scenarioId}`);

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

        // Honour If-Match header as ETag source (standard HTTP); fall back to body.etag
        const ifMatch = request.headers.get('if-match');
        const updates = { ...body, etag: ifMatch || body.etag };

        try {
            const service = getScenarioService();
            const scenario = await service.updateScenario(user.userId, scenarioId, updates);

            if (!scenario) {
                return {
                    status: 404,
                    jsonBody: buildErrorBody('Scenario not found', 'NOT_FOUND')
                };
            }

            return {
                status: 200,
                jsonBody: { id: scenario.id, updatedAt: scenario.updatedAt }
            };
        } catch (err) {
            if (err.conflict) {
                return {
                    status: 409,
                    jsonBody: {
                        error: 'Conflict detected',
                        code: 'CONFLICT',
                        serverVersion: err.serverVersion,
                        timestamp: new Date().toISOString()
                    }
                };
            }
            if (err.validationError) {
                return {
                    status: 400,
                    jsonBody: buildErrorBody(err.message, 'VALIDATION_ERROR')
                };
            }
            context.log.error('Error updating scenario:', err);
            return {
                status: 500,
                jsonBody: buildErrorBody('Internal server error', 'INTERNAL_ERROR')
            };
        }
    }
});

// ---------------------------------------------------------------------------
// DELETE /api/scenarios/{id}
// ---------------------------------------------------------------------------
app.http('deleteScenario', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'scenarios/{id}',
    handler: async (request, context) => {
        const scenarioId = request.params.id;
        context.log(`DELETE /api/scenarios/${scenarioId}`);

        let user;
        try {
            user = requireAuth(request);
        } catch (err) {
            return { status: err.status || 401, jsonBody: err.body };
        }

        try {
            const service = getScenarioService();
            const deleted = await service.deleteScenario(user.userId, scenarioId);

            if (!deleted) {
                return {
                    status: 404,
                    jsonBody: buildErrorBody('Scenario not found', 'NOT_FOUND')
                };
            }

            return { status: 204 };
        } catch (err) {
            context.log.error('Error deleting scenario:', err);
            return {
                status: 500,
                jsonBody: buildErrorBody('Internal server error', 'INTERNAL_ERROR')
            };
        }
    }
});

// ---------------------------------------------------------------------------
// POST /api/scenarios/{id}/activate
// ---------------------------------------------------------------------------
app.http('activateScenario', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'scenarios/{id}/activate',
    handler: async (request, context) => {
        const scenarioId = request.params.id;
        context.log(`POST /api/scenarios/${scenarioId}/activate`);

        let user;
        try {
            user = requireAuth(request);
        } catch (err) {
            return { status: err.status || 401, jsonBody: err.body };
        }

        try {
            const scenariosService = getScenarioService();
            const activated = await scenariosService.setActiveScenario(
                user.userId,
                scenarioId
            );

            if (!activated) {
                return {
                    status: 404,
                    jsonBody: buildErrorBody('Scenario not found', 'NOT_FOUND')
                };
            }

            // Also persist the activeScenarioId on the user's profile
            try {
                const profileService = getProfileService();
                await profileService.updateUserProfile(user.userId, {
                    activeScenarioId: scenarioId
                });
            } catch (profileErr) {
                // Non-fatal – log and continue
                context.log.warn('Could not update profile activeScenarioId:', profileErr);
            }

            return {
                status: 200,
                jsonBody: { success: true, activeScenarioId: scenarioId }
            };
        } catch (err) {
            context.log.error('Error activating scenario:', err);
            return {
                status: 500,
                jsonBody: buildErrorBody('Internal server error', 'INTERNAL_ERROR')
            };
        }
    }
});
