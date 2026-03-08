'use strict';

const { TableStorageService } = require('../../src/services/table-storage');

/**
 * Build a mock TableClient that stores entities in-memory.
 */
function buildMockTableClient() {
    const store = new Map();

    function key(pk, rk) {
        return `${pk}::${rk}`;
    }

    return {
        _store: store,
        createEntity: jest.fn(async (entity) => {
            const k = key(entity.partitionKey, entity.rowKey);
            if (store.has(k)) {
                const err = new Error('Entity already exists');
                err.statusCode = 409;
                throw err;
            }
            store.set(k, { ...entity, etag: 'etag-initial' });
        }),
        getEntity: jest.fn(async (pk, rk) => {
            const k = key(pk, rk);
            if (!store.has(k)) {
                const err = new Error('Entity not found');
                err.statusCode = 404;
                throw err;
            }
            return { ...store.get(k) };
        }),
        updateEntity: jest.fn(async (entity) => {
            const k = key(entity.partitionKey, entity.rowKey);
            store.set(k, { ...entity, etag: 'etag-updated' });
            return { etag: 'etag-updated' };
        }),
        deleteEntity: jest.fn(async (pk, rk) => {
            const k = key(pk, rk);
            if (!store.has(k)) {
                const err = new Error('Entity not found');
                err.statusCode = 404;
                throw err;
            }
            store.delete(k);
        }),
        listEntities: jest.fn(({ queryOptions } = {}) => {
            const allEntities = [...store.values()];
            // Very simple filter: support only PartitionKey eq 'value'
            let filtered = allEntities;
            if (queryOptions && queryOptions.filter) {
                const match = queryOptions.filter.match(/PartitionKey eq '([^']+)'/);
                if (match) {
                    filtered = allEntities.filter((e) => e.partitionKey === match[1]);
                }
            }
            return {
                byPage: ({ maxPageSize } = {}) => {
                    const page = maxPageSize ? filtered.slice(0, maxPageSize) : filtered;
                    page.continuationToken = null;
                    return (async function* () { yield page; })();
                }
            };
        })
    };
}

// Patch TableStorageService to use mock clients
function buildMockService() {
    const conn = 'UseDevelopmentStorage=true';
    const service = new TableStorageService(conn);
    const clients = new Map();

    service._getClient = (tableName) => {
        if (!clients.has(tableName)) {
            clients.set(tableName, buildMockTableClient());
        }
        return clients.get(tableName);
    };

    // Expose clients for inspection
    service._mockClients = clients;
    return service;
}

describe('TableStorageService', () => {
    test('throws if no connection string provided', () => {
        expect(() => new TableStorageService('')).toThrow();
    });

    describe('createEntity', () => {
        test('creates an entity and returns it', async () => {
            const svc = buildMockService();
            const entity = { partitionKey: 'user1', rowKey: 'scenario1', name: 'Test' };
            const result = await svc.createEntity('scenarios', entity);
            expect(result).toEqual(entity);
        });
    });

    describe('getEntity', () => {
        test('returns entity when found', async () => {
            const svc = buildMockService();
            const entity = { partitionKey: 'user1', rowKey: 'row1', value: 42 };
            await svc.createEntity('profiles', entity);
            const found = await svc.getEntity('profiles', 'user1', 'row1');
            expect(found.value).toBe(42);
        });

        test('returns null when not found', async () => {
            const svc = buildMockService();
            const result = await svc.getEntity('profiles', 'ghost', 'none');
            expect(result).toBeNull();
        });
    });

    describe('updateEntity', () => {
        test('updates entity and returns it with new etag', async () => {
            const svc = buildMockService();
            const entity = { partitionKey: 'u', rowKey: 'r', v: 1 };
            await svc.createEntity('t', entity);
            const updated = await svc.updateEntity('t', { ...entity, v: 2 });
            expect(updated.v).toBe(2);
        });
    });

    describe('deleteEntity', () => {
        test('deletes an existing entity', async () => {
            const svc = buildMockService();
            await svc.createEntity('t', { partitionKey: 'p', rowKey: 'r' });
            await svc.deleteEntity('t', 'p', 'r');
            const result = await svc.getEntity('t', 'p', 'r');
            expect(result).toBeNull();
        });

        test('is idempotent – does not throw when entity not found', async () => {
            const svc = buildMockService();
            await expect(svc.deleteEntity('t', 'missing', 'missing')).resolves.toBeUndefined();
        });
    });

    describe('listEntities', () => {
        test('returns empty list when no entities', async () => {
            const svc = buildMockService();
            const { entities } = await svc.listEntities('empty-table');
            expect(entities).toEqual([]);
        });

        test('returns all entities for a partition', async () => {
            const svc = buildMockService();
            await svc.createEntity('t', { partitionKey: 'userA', rowKey: 's1', n: 'A1' });
            await svc.createEntity('t', { partitionKey: 'userA', rowKey: 's2', n: 'A2' });
            await svc.createEntity('t', { partitionKey: 'userB', rowKey: 's1', n: 'B1' });

            const { entities } = await svc.listEntities('t', {
                filter: "PartitionKey eq 'userA'"
            });
            expect(entities).toHaveLength(2);
            expect(entities.every((e) => e.partitionKey === 'userA')).toBe(true);
        });

        test('honours maxPageSize', async () => {
            const svc = buildMockService();
            for (let i = 0; i < 5; i++) {
                await svc.createEntity('t', { partitionKey: 'u', rowKey: `r${i}` });
            }
            const { entities } = await svc.listEntities('t', {
                filter: "PartitionKey eq 'u'",
                maxPageSize: 3
            });
            expect(entities).toHaveLength(3);
        });
    });
});
