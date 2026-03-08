'use strict';

/**
 * Health Check Service
 *
 * Provides individual diagnostic checks that the /health endpoint runs on
 * every request.  Each check returns a result object:
 *   { name: string, status: 'ok' | 'error', error?: string }
 *
 * Checks included:
 *   1. storage_connection_string – verifies AZURE_STORAGE_CONNECTION_STRING is set
 *   2. table_storage             – attempts a live query against Azure Table Storage
 *   3. scenarios_table           – verifies TABLE_NAME_SCENARIOS config is present
 *   4. profiles_table            – verifies TABLE_NAME_PROFILES config is present
 */

const { TableServiceClient } = require('@azure/data-tables');

// ─── Individual checks ────────────────────────────────────────────────────────

/**
 * Check 1: storage_connection_string
 * Ensures the required environment variable is present.
 *
 * @returns {{ name: string, status: string, error?: string }}
 */
function checkStorageConnectionString() {
    const name = 'storage_connection_string';
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connStr || connStr.trim() === '') {
        return {
            name,
            status: 'error',
            error: 'AZURE_STORAGE_CONNECTION_STRING environment variable is not set'
        };
    }

    return { name, status: 'ok' };
}

/**
 * Check 2: table_storage
 * Attempts a lightweight query (list tables, first page only) to verify that
 * the storage account is reachable.  Skipped – with an explanatory message –
 * when the connection string is absent so we avoid a redundant error.
 *
 * @param {Function} [clientFactory] - Optional factory for creating a TableServiceClient.
 *   Defaults to TableServiceClient.fromConnectionString.  Accepts a connection string
 *   and returns a client with a listTables() method.  Provided here to enable unit
 *   testing without real Azure infrastructure.
 * @returns {Promise<{ name: string, status: string, error?: string }>}
 */
async function checkTableStorageConnectivity(
    clientFactory = (cs) => TableServiceClient.fromConnectionString(cs)
) {
    const name = 'table_storage';
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connStr || connStr.trim() === '') {
        return {
            name,
            status: 'error',
            error: 'Skipped – AZURE_STORAGE_CONNECTION_STRING is not set'
        };
    }

    try {
        const serviceClient = clientFactory(connStr);
        // Fetch the very first page of tables; we don't need the results.
        const iter = serviceClient.listTables().byPage({ maxPageSize: 1 });
        await iter.next();
        return { name, status: 'ok' };
    } catch (err) {
        return {
            name,
            status: 'error',
            error: err.message || 'Failed to connect to Azure Table Storage'
        };
    }
}

/**
 * Check 3: scenarios_table
 * Reports the active table name for scenarios (TABLE_NAME_SCENARIOS env var,
 * falling back to the 'userscenarios' default used by the storage service).
 *
 * @returns {{ name: string, status: string, detail: string }}
 */
function checkScenariosTable() {
    const name = 'scenarios_table';
    const tableName = process.env.TABLE_NAME_SCENARIOS || 'userscenarios';
    return { name, status: 'ok', detail: tableName };
}

/**
 * Check 4: profiles_table
 * Reports the active table name for user profiles (TABLE_NAME_PROFILES env var,
 * falling back to the 'userprofiles' default used by the storage service).
 *
 * @returns {{ name: string, status: string, detail: string }}
 */
function checkProfilesTable() {
    const name = 'profiles_table';
    const tableName = process.env.TABLE_NAME_PROFILES || 'userprofiles';
    return { name, status: 'ok', detail: tableName };
}

// ─── Aggregate runner ─────────────────────────────────────────────────────────

/**
 * Run all health checks and return an aggregated result.
 *
 * @param {object} [options]
 * @param {Function} [options.tableClientFactory] - Injected factory for table storage
 *   connectivity check (see checkTableStorageConnectivity).
 * @returns {Promise<{ status: 'ok'|'error', checks: Array<object>, timestamp: string, service: string }>}
 */
async function runAllChecks(options = {}) {
    const [
        storageConnCheck,
        tableConnCheck,
        scenariosTableCheck,
        profilesTableCheck
    ] = await Promise.all([
        Promise.resolve(checkStorageConnectionString()),
        checkTableStorageConnectivity(options.tableClientFactory),
        Promise.resolve(checkScenariosTable()),
        Promise.resolve(checkProfilesTable())
    ]);

    const checks = [
        storageConnCheck,
        tableConnCheck,
        scenariosTableCheck,
        profilesTableCheck
    ];

    const overallStatus = checks.some((c) => c.status !== 'ok') ? 'error' : 'ok';

    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        service: 'CCS Calculator API',
        checks
    };
}

module.exports = {
    checkStorageConnectionString,
    checkTableStorageConnectivity,
    checkScenariosTable,
    checkProfilesTable,
    runAllChecks
};

