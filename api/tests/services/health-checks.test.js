'use strict';

/**
 * Tests for the health-checks service.
 *
 * All network calls are replaced by injected mock factories so these tests
 * run without any real Azure infrastructure.
 */

const {
    checkStorageConnectionString,
    checkTableStorageConnectivity,
    checkScenariosTable,
    checkProfilesTable,
    runAllChecks
} = require('../../src/services/health-checks');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a mock TableServiceClient factory that resolves successfully. */
function makeSuccessFactory() {
    return jest.fn(() => ({
        listTables: jest.fn(() => ({
            byPage: jest.fn(() => ({
                next: jest.fn(() => Promise.resolve({ value: [], done: false }))
            }))
        }))
    }));
}

/** Build a mock TableServiceClient factory that rejects with the given message. */
function makeFailFactory(message = 'Network failure') {
    return jest.fn(() => ({
        listTables: jest.fn(() => ({
            byPage: jest.fn(() => ({
                next: jest.fn(() => Promise.reject(new Error(message)))
            }))
        }))
    }));
}

// ─── checkStorageConnectionString ────────────────────────────────────────────

describe('checkStorageConnectionString', () => {
    const ORIG = process.env.AZURE_STORAGE_CONNECTION_STRING;

    afterEach(() => {
        if (ORIG === undefined) {
            delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        } else {
            process.env.AZURE_STORAGE_CONNECTION_STRING = ORIG;
        }
    });

    test('returns ok when env var is set', () => {
        process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;...';
        const result = checkStorageConnectionString();
        expect(result).toEqual({ name: 'storage_connection_string', status: 'ok' });
    });

    test('returns error when env var is missing', () => {
        delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        const result = checkStorageConnectionString();
        expect(result.name).toBe('storage_connection_string');
        expect(result.status).toBe('error');
        expect(result.error).toBeTruthy();
    });

    test('returns error when env var is an empty string', () => {
        process.env.AZURE_STORAGE_CONNECTION_STRING = '';
        const result = checkStorageConnectionString();
        expect(result.status).toBe('error');
    });
});

// ─── checkScenariosTable ──────────────────────────────────────────────────────

describe('checkScenariosTable', () => {
    const ORIG = process.env.TABLE_NAME_SCENARIOS;

    afterEach(() => {
        if (ORIG === undefined) {
            delete process.env.TABLE_NAME_SCENARIOS;
        } else {
            process.env.TABLE_NAME_SCENARIOS = ORIG;
        }
    });

    test('returns ok with default table name when env var is absent', () => {
        delete process.env.TABLE_NAME_SCENARIOS;
        const result = checkScenariosTable();
        expect(result.status).toBe('ok');
        expect(result.detail).toBe('userscenarios');
    });

    test('returns ok with a custom table name', () => {
        process.env.TABLE_NAME_SCENARIOS = 'myscenarios';
        const result = checkScenariosTable();
        expect(result.status).toBe('ok');
        expect(result.detail).toBe('myscenarios');
    });
});

// ─── checkProfilesTable ───────────────────────────────────────────────────────

describe('checkProfilesTable', () => {
    const ORIG = process.env.TABLE_NAME_PROFILES;

    afterEach(() => {
        if (ORIG === undefined) {
            delete process.env.TABLE_NAME_PROFILES;
        } else {
            process.env.TABLE_NAME_PROFILES = ORIG;
        }
    });

    test('returns ok with default table name when env var is absent', () => {
        delete process.env.TABLE_NAME_PROFILES;
        const result = checkProfilesTable();
        expect(result.status).toBe('ok');
        expect(result.detail).toBe('userprofiles');
    });

    test('returns ok with a custom table name', () => {
        process.env.TABLE_NAME_PROFILES = 'myprofiles';
        const result = checkProfilesTable();
        expect(result.status).toBe('ok');
        expect(result.detail).toBe('myprofiles');
    });
});

// ─── checkTableStorageConnectivity ───────────────────────────────────────────

describe('checkTableStorageConnectivity', () => {
    const ORIG = process.env.AZURE_STORAGE_CONNECTION_STRING;

    afterEach(() => {
        if (ORIG === undefined) {
            delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        } else {
            process.env.AZURE_STORAGE_CONNECTION_STRING = ORIG;
        }
    });

    test('returns error when connection string is absent', async () => {
        delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        const result = await checkTableStorageConnectivity();
        expect(result.name).toBe('table_storage');
        expect(result.status).toBe('error');
    });

    test('returns ok when the mock client resolves successfully', async () => {
        process.env.AZURE_STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
        const result = await checkTableStorageConnectivity(makeSuccessFactory());
        expect(result.name).toBe('table_storage');
        expect(result.status).toBe('ok');
    });

    test('returns error when the mock client rejects', async () => {
        process.env.AZURE_STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
        const result = await checkTableStorageConnectivity(makeFailFactory('Network failure'));
        expect(result.name).toBe('table_storage');
        expect(result.status).toBe('error');
        expect(result.error).toBe('Network failure');
    });

    test('passes the connection string to the factory', async () => {
        const connStr = 'UseDevelopmentStorage=true';
        process.env.AZURE_STORAGE_CONNECTION_STRING = connStr;
        const factory = makeSuccessFactory();
        await checkTableStorageConnectivity(factory);
        expect(factory).toHaveBeenCalledWith(connStr);
    });
});

// ─── runAllChecks ─────────────────────────────────────────────────────────────

describe('runAllChecks', () => {
    const ORIG_CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const ORIG_SCEN = process.env.TABLE_NAME_SCENARIOS;
    const ORIG_PROF = process.env.TABLE_NAME_PROFILES;

    afterEach(() => {
        if (ORIG_CONN === undefined) {
            delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        } else {
            process.env.AZURE_STORAGE_CONNECTION_STRING = ORIG_CONN;
        }
        if (ORIG_SCEN === undefined) delete process.env.TABLE_NAME_SCENARIOS;
        else process.env.TABLE_NAME_SCENARIOS = ORIG_SCEN;
        if (ORIG_PROF === undefined) delete process.env.TABLE_NAME_PROFILES;
        else process.env.TABLE_NAME_PROFILES = ORIG_PROF;
    });

    test('returns overall error status when storage connection string is absent', async () => {
        delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        const result = await runAllChecks();

        expect(result.status).toBe('error');
        expect(result.service).toBe('CCS Calculator API');
        expect(result.timestamp).toBeTruthy();
        expect(Array.isArray(result.checks)).toBe(true);
        expect(result.checks.length).toBeGreaterThan(0);

        const connCheck = result.checks.find((c) => c.name === 'storage_connection_string');
        expect(connCheck).toBeDefined();
        expect(connCheck.status).toBe('error');
    });

    test('returns overall ok when all checks pass', async () => {
        process.env.AZURE_STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
        const result = await runAllChecks({ tableClientFactory: makeSuccessFactory() });

        expect(result.status).toBe('ok');
        expect(result.checks.every((c) => c.status === 'ok')).toBe(true);
    });

    test('returns error when storage connectivity fails but connection string is set', async () => {
        process.env.AZURE_STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
        const result = await runAllChecks({ tableClientFactory: makeFailFactory('Timeout') });

        expect(result.status).toBe('error');
        const tableCheck = result.checks.find((c) => c.name === 'table_storage');
        expect(tableCheck.status).toBe('error');
        expect(tableCheck.error).toBe('Timeout');
    });

    test('uses default table names when TABLE_NAME_* env vars are absent', async () => {
        process.env.AZURE_STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
        delete process.env.TABLE_NAME_SCENARIOS;
        delete process.env.TABLE_NAME_PROFILES;
        const result = await runAllChecks({ tableClientFactory: makeSuccessFactory() });

        const scenCheck = result.checks.find((c) => c.name === 'scenarios_table');
        const profCheck = result.checks.find((c) => c.name === 'profiles_table');
        expect(scenCheck.status).toBe('ok');
        expect(profCheck.status).toBe('ok');
    });

    test('response includes all four named checks', async () => {
        delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        const result = await runAllChecks();

        const names = result.checks.map((c) => c.name);
        expect(names).toContain('storage_connection_string');
        expect(names).toContain('table_storage');
        expect(names).toContain('scenarios_table');
        expect(names).toContain('profiles_table');
    });
});

