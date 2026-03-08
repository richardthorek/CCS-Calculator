'use strict';

/**
 * Health Check Endpoint
 *
 * GET /api/health
 * Auth: None (anonymous)
 *
 * Runs a suite of diagnostic checks and returns a structured JSON report.
 *
 * Response format:
 *   {
 *     "status":    "ok" | "error",
 *     "timestamp": "<ISO-8601>",
 *     "service":   "CCS Calculator API",
 *     "checks": [
 *       { "name": "<check-name>", "status": "ok" | "error", "error": "<msg if error>" },
 *       ...
 *     ]
 *   }
 *
 * HTTP status codes:
 *   200 – all checks passed
 *   503 – one or more checks failed
 *
 * Checks included:
 *   1. storage_connection_string – AZURE_STORAGE_CONNECTION_STRING env var is set
 *   2. table_storage             – live connectivity to Azure Table Storage
 *   3. scenarios_table           – TABLE_NAME_SCENARIOS configuration is present
 *   4. profiles_table            – TABLE_NAME_PROFILES configuration is present
 */

const { app } = require('@azure/functions');
const { runAllChecks } = require('../services/health-checks');

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Health check endpoint called');

        const result = await runAllChecks();
        const httpStatus = result.status === 'ok' ? 200 : 503;

        return {
            status: httpStatus,
            jsonBody: result
        };
    }
});
