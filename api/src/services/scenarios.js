'use strict';

/**
 * Scenarios Service
 *
 * Manages scenario entities in Azure Table Storage with optimistic concurrency
 * (ETag-based conflict detection).
 *
 * Table: userscenarios (TABLE_NAME_SCENARIOS env var)
 *   PartitionKey: userId
 *   RowKey:       scenarioId (GUID)
 */

const { randomUUID } = require('crypto');
const { createTableStorageService } = require('./table-storage');

const TABLE_NAME = process.env.TABLE_NAME_SCENARIOS || 'userscenarios';

/** Maximum number of scenarios a single user may store. */
const MAX_SCENARIOS_PER_USER = 100;

class ScenariosService {
    /**
     * @param {import('./table-storage').TableStorageService} storageService
     */
    constructor(storageService) {
        this._storage = storageService;
    }

    /**
     * List all scenarios for a user.
     *
     * @param {string} userId
     * @param {object} [options]
     * @param {number} [options.limit=100]
     * @param {string} [options.continuationToken]
     * @returns {Promise<{ scenarios: object[], continuationToken: string|null }>}
     */
    async getUserScenarios(userId, options = {}) {
        const limit = Math.min(options.limit || 100, MAX_SCENARIOS_PER_USER);
        const filter = `PartitionKey eq '${userId.replace(/'/g, "''")}'`;

        const result = await this._storage.listEntities(TABLE_NAME, {
            filter,
            maxPageSize: limit,
            continuationToken: options.continuationToken
        });

        return {
            scenarios: result.entities.map(this._toScenarioSummary),
            continuationToken: result.continuationToken
        };
    }

    /**
     * Retrieve a single scenario by ID.
     *
     * @param {string} userId
     * @param {string} scenarioId
     * @returns {Promise<object|null>} Full scenario object or null if not found
     */
    async getScenario(userId, scenarioId) {
        const entity = await this._storage.getEntity(TABLE_NAME, userId, scenarioId);
        if (!entity) {
            return null;
        }
        return this._toScenario(entity);
    }

    /**
     * Create a new scenario.
     *
     * @param {string} userId
     * @param {object} scenarioData
     * @param {string} scenarioData.name
     * @param {object} scenarioData.data     - Arbitrary JSON scenario state
     * @param {boolean} [scenarioData.isActive]
     * @returns {Promise<object>} The created scenario
     */
    async createScenario(userId, scenarioData) {
        this._validateScenarioInput(scenarioData);

        const scenarioId = randomUUID();
        const now = new Date().toISOString();

        const entity = {
            partitionKey: userId,
            rowKey: scenarioId,
            scenarioName: scenarioData.name,
            scenarioData: JSON.stringify(scenarioData.data || {}),
            keyInputs: scenarioData.keyInputs ? JSON.stringify(scenarioData.keyInputs) : '',
            version: 1,
            createdAt: now,
            updatedAt: now,
            isActive: scenarioData.isActive === true,
            tags: scenarioData.tags || ''
        };

        await this._storage.createEntity(TABLE_NAME, entity);
        return this._toScenario(entity);
    }

    /**
     * Update an existing scenario.
     * Supports ETag-based optimistic concurrency: if the caller supplies an
     * `etag` property in `updates`, the operation will fail with a 409-flavoured
     * error if the server version has changed.
     *
     * @param {string} userId
     * @param {string} scenarioId
     * @param {object} updates
     * @param {string} [updates.name]
     * @param {object} [updates.data]
     * @param {boolean} [updates.isActive]
     * @param {string} [updates.etag]  - If supplied, enables conflict detection
     * @returns {Promise<object>} The updated scenario
     * @throws {{ conflict: true, serverVersion: object }} On ETag mismatch
     */
    async updateScenario(userId, scenarioId, updates) {
        const existing = await this._storage.getEntity(TABLE_NAME, userId, scenarioId);

        if (!existing) {
            return null;
        }

        // ETag-based conflict detection
        if (updates.etag && updates.etag !== '*' && updates.etag !== existing.etag) {
            const conflict = new Error('Conflict');
            conflict.conflict = true;
            conflict.serverVersion = this._toScenario(existing);
            throw conflict;
        }

        const now = new Date().toISOString();
        const merged = {
            ...existing,
            updatedAt: now,
            etag: updates.etag || existing.etag
        };

        if (updates.name !== undefined) {
            merged.scenarioName = updates.name;
        }
        if (updates.data !== undefined) {
            merged.scenarioData = JSON.stringify(updates.data);
        }
        if (updates.keyInputs !== undefined) {
            merged.keyInputs = JSON.stringify(updates.keyInputs);
        }
        if (updates.isActive !== undefined) {
            merged.isActive = updates.isActive;
        }

        const updated = await this._storage.updateEntity(TABLE_NAME, merged);
        return this._toScenario(updated);
    }

    /**
     * Delete a scenario.
     *
     * @param {string} userId
     * @param {string} scenarioId
     * @returns {Promise<boolean>} true if deleted, false if not found
     */
    async deleteScenario(userId, scenarioId) {
        const existing = await this._storage.getEntity(TABLE_NAME, userId, scenarioId);
        if (!existing) {
            return false;
        }
        await this._storage.deleteEntity(TABLE_NAME, userId, scenarioId);
        return true;
    }

    /**
     * Mark a scenario as the active one for the user.
     * Deactivates all other scenarios for that user.
     *
     * @param {string} userId
     * @param {string} scenarioId
     * @returns {Promise<boolean>} true if activated, false if scenario not found
     */
    async setActiveScenario(userId, scenarioId) {
        const target = await this._storage.getEntity(TABLE_NAME, userId, scenarioId);
        if (!target) {
            return false;
        }

        // Deactivate any currently active scenario
        const { entities } = await this._storage.listEntities(TABLE_NAME, {
            filter: `PartitionKey eq '${userId.replace(/'/g, "''")}' and isActive eq true`
        });

        for (const entity of entities) {
            if (entity.rowKey !== scenarioId) {
                await this._storage.updateEntity(TABLE_NAME, {
                    ...entity,
                    isActive: false,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        // Activate the target
        await this._storage.updateEntity(TABLE_NAME, {
            ...target,
            isActive: true,
            updatedAt: new Date().toISOString()
        });

        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Validate scenario input, throwing a structured error on failure.
     * @private
     */
    _validateScenarioInput(data) {
        if (!data || typeof data.name !== 'string' || data.name.trim() === '') {
            const err = new Error('Scenario name is required');
            err.validationError = true;
            throw err;
        }
        if (data.name.length > 200) {
            const err = new Error('Scenario name must not exceed 200 characters');
            err.validationError = true;
            throw err;
        }
    }

    /**
     * Map a raw entity to a summary object (used in list responses).
     * @private
     */
    _toScenarioSummary(entity) {
        let keyInputs = null;
        try {
            keyInputs = entity.keyInputs ? JSON.parse(entity.keyInputs) : null;
        } catch {
            keyInputs = null;
        }
        return {
            id: entity.rowKey,
            name: entity.scenarioName || '',
            createdAt: entity.createdAt || null,
            updatedAt: entity.updatedAt || null,
            isActive: entity.isActive === true,
            tags: entity.tags || '',
            keyInputs
        };
    }

    /**
     * Map a raw entity to a full scenario object (includes data blob).
     * @private
     */
    _toScenario(entity) {
        let data = {};
        try {
            data = JSON.parse(entity.scenarioData || '{}');
        } catch {
            data = {};
        }

        return {
            id: entity.rowKey,
            name: entity.scenarioName || '',
            data,
            version: entity.version || 1,
            createdAt: entity.createdAt || null,
            updatedAt: entity.updatedAt || null,
            isActive: entity.isActive === true,
            tags: entity.tags || '',
            etag: entity.etag || null
        };
    }
}

/**
 * Factory – creates a ScenariosService backed by Table Storage.
 *
 * @param {import('./table-storage').TableStorageService} [storageService]
 * @returns {ScenariosService}
 */
function createScenariosService(storageService) {
    const storage = storageService || createTableStorageService();
    return new ScenariosService(storage);
}

module.exports = { ScenariosService, createScenariosService };
