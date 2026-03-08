'use strict';

/**
 * Table Storage Service
 *
 * Thin wrapper around @azure/data-tables that encapsulates connection
 * management and provides a simple CRUD interface used by higher-level
 * services.
 *
 * Configuration (environment variables):
 *   AZURE_STORAGE_CONNECTION_STRING – connection string for the storage account
 *   TABLE_NAME_SCENARIOS             – table name for user scenarios (default: "userscenarios")
 *   TABLE_NAME_PROFILES              – table name for user profiles  (default: "userprofiles")
 */

const { TableServiceClient, TableClient, odata } = require('@azure/data-tables');

class TableStorageService {
    /**
     * @param {string} connectionString - Azure Storage connection string
     */
    constructor(connectionString) {
        if (!connectionString) {
            throw new Error(
                'AZURE_STORAGE_CONNECTION_STRING environment variable is not set'
            );
        }
        this._connectionString = connectionString;
        /** @type {Map<string, TableClient>} */
        this._clients = new Map();
    }

    /**
     * Lazily create a TableClient for the given table name.
     *
     * @param {string} tableName
     * @returns {TableClient}
     */
    _getClient(tableName) {
        if (!this._clients.has(tableName)) {
            const client = TableClient.fromConnectionString(
                this._connectionString,
                tableName
            );
            this._clients.set(tableName, client);
        }
        return this._clients.get(tableName);
    }

    /**
     * Ensure a table exists, creating it if necessary.
     *
     * @param {string} tableName
     */
    async ensureTableExists(tableName) {
        try {
            const serviceClient = TableServiceClient.fromConnectionString(
                this._connectionString
            );
            await serviceClient.createTable(tableName);
        } catch (err) {
            // TableAlreadyExists is not an error for us
            if (err.statusCode !== 409) {
                throw err;
            }
        }
    }

    /**
     * Create a new entity.
     *
     * @param {string} tableName
     * @param {object} entity - Must include partitionKey and rowKey
     * @returns {Promise<object>} The created entity
     */
    async createEntity(tableName, entity) {
        const client = this._getClient(tableName);
        await client.createEntity(entity);
        return entity;
    }

    /**
     * Retrieve a single entity by partition + row key.
     *
     * @param {string} tableName
     * @param {string} partitionKey
     * @param {string} rowKey
     * @returns {Promise<object|null>} The entity, or null if not found
     */
    async getEntity(tableName, partitionKey, rowKey) {
        const client = this._getClient(tableName);
        try {
            return await client.getEntity(partitionKey, rowKey);
        } catch (err) {
            if (err.statusCode === 404) {
                return null;
            }
            throw err;
        }
    }

    /**
     * Update an existing entity using merge semantics.
     * Supports optimistic concurrency via the entity's etag property.
     *
     * @param {string} tableName
     * @param {object} entity - Must include partitionKey, rowKey, and optionally etag
     * @returns {Promise<object>} The updated entity (with new etag if returned)
     */
    async updateEntity(tableName, entity) {
        const client = this._getClient(tableName);
        const etag = entity.etag || '*';
        const response = await client.updateEntity(entity, 'Merge', { etag });
        // Return the entity merged with any new etag
        return { ...entity, etag: response.etag || entity.etag };
    }

    /**
     * Delete an entity by partition + row key.
     *
     * @param {string} tableName
     * @param {string} partitionKey
     * @param {string} rowKey
     * @returns {Promise<void>}
     */
    async deleteEntity(tableName, partitionKey, rowKey) {
        const client = this._getClient(tableName);
        try {
            await client.deleteEntity(partitionKey, rowKey);
        } catch (err) {
            if (err.statusCode === 404) {
                return; // Idempotent delete
            }
            throw err;
        }
    }

    /**
     * List entities in a table, optionally filtered via an OData expression.
     *
     * @param {string} tableName
     * @param {object} [options]
     * @param {string} [options.filter]      - OData filter string
     * @param {number} [options.maxPageSize] - Maximum number of results
     * @param {string} [options.continuationToken] - Token for pagination
     * @returns {Promise<{ entities: object[], continuationToken: string|null }>}
     */
    async listEntities(tableName, options = {}) {
        const client = this._getClient(tableName);
        const queryOptions = {};

        if (options.filter) {
            queryOptions.filter = options.filter;
        }

        const maxPageSize = options.maxPageSize || 100;
        const entities = [];
        let continuationToken = options.continuationToken || undefined;

        const iterator = client.listEntities({ queryOptions });
        const page = iterator.byPage({ maxPageSize, continuationToken });

        // We only fetch one page at a time to support cursor-based pagination
        for await (const p of page) {
            for (const entity of p) {
                entities.push(entity);
            }
            // Capture continuation token from the page response
            continuationToken = p.continuationToken || null;
            break; // One page only
        }

        return { entities, continuationToken: continuationToken || null };
    }
}

// Export a factory so callers can supply the connection string (simplifies testing)
function createTableStorageService(
    connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
) {
    return new TableStorageService(connectionString);
}

module.exports = { TableStorageService, createTableStorageService, odata };
