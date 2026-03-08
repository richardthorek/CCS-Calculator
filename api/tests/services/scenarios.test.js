'use strict';

const { ScenariosService } = require('../../src/services/scenarios');

/**
 * Build an in-memory TableStorageService mock for scenario tests.
 */
function buildMockStorage() {
    const store = new Map();

    function key(pk, rk) {
        return `${pk}::${rk}`;
    }

    return {
        _store: store,
        createEntity: jest.fn(async (_table, entity) => {
            store.set(key(entity.partitionKey, entity.rowKey), {
                ...entity,
                etag: 'etag-v1'
            });
            return entity;
        }),
        getEntity: jest.fn(async (_table, pk, rk) => {
            return store.get(key(pk, rk)) || null;
        }),
        updateEntity: jest.fn(async (_table, entity) => {
            const updated = { ...entity, etag: 'etag-v2' };
            store.set(key(entity.partitionKey, entity.rowKey), updated);
            return updated;
        }),
        deleteEntity: jest.fn(async (_table, pk, rk) => {
            store.delete(key(pk, rk));
        }),
        listEntities: jest.fn(async (_table, options = {}) => {
            let entities = [...store.values()];
            if (options.filter) {
                const match = options.filter.match(/PartitionKey eq '([^']+)'/);
                if (match) {
                    entities = entities.filter((e) => e.partitionKey === match[1]);
                }
                // Also handle isActive filter
                if (options.filter.includes('isActive eq true')) {
                    entities = entities.filter((e) => e.isActive === true);
                }
            }
            const maxPageSize = options.maxPageSize || 100;
            const page = entities.slice(0, maxPageSize);
            return { entities: page, continuationToken: null };
        })
    };
}

function buildService() {
    const storage = buildMockStorage();
    const service = new ScenariosService(storage);
    return { service, storage };
}

describe('ScenariosService', () => {
    describe('createScenario', () => {
        test('creates and returns a scenario with generated ID', async () => {
            const { service } = buildService();
            const scenario = await service.createScenario('user1', {
                name: 'Test Scenario',
                data: { income: 80000 },
                isActive: false
            });

            expect(scenario.id).toBeDefined();
            expect(scenario.name).toBe('Test Scenario');
            expect(scenario.data).toEqual({ income: 80000 });
            expect(scenario.isActive).toBe(false);
            expect(scenario.createdAt).toBeDefined();
            expect(scenario.updatedAt).toBeDefined();
        });

        test('throws validationError when name is missing', async () => {
            const { service } = buildService();
            await expect(
                service.createScenario('user1', { data: {} })
            ).rejects.toMatchObject({ validationError: true });
        });

        test('throws validationError when name is empty string', async () => {
            const { service } = buildService();
            await expect(
                service.createScenario('user1', { name: '   ', data: {} })
            ).rejects.toMatchObject({ validationError: true });
        });

        test('throws validationError when name exceeds 200 chars', async () => {
            const { service } = buildService();
            await expect(
                service.createScenario('user1', { name: 'x'.repeat(201), data: {} })
            ).rejects.toMatchObject({ validationError: true });
        });
    });

    describe('getUserScenarios', () => {
        test('returns empty array when user has no scenarios', async () => {
            const { service } = buildService();
            const { scenarios } = await service.getUserScenarios('nobody');
            expect(scenarios).toEqual([]);
        });

        test('returns summaries for all user scenarios', async () => {
            const { service } = buildService();
            await service.createScenario('user1', { name: 'S1', data: {} });
            await service.createScenario('user1', { name: 'S2', data: {} });

            const { scenarios } = await service.getUserScenarios('user1');
            expect(scenarios).toHaveLength(2);
            expect(scenarios[0]).toHaveProperty('id');
            expect(scenarios[0]).toHaveProperty('name');
            expect(scenarios[0]).not.toHaveProperty('data'); // summaries omit data
        });
    });

    describe('getScenario', () => {
        test('returns full scenario including data', async () => {
            const { service } = buildService();
            const created = await service.createScenario('user1', {
                name: 'My Scenario',
                data: { children: 2 }
            });

            const fetched = await service.getScenario('user1', created.id);
            expect(fetched).not.toBeNull();
            expect(fetched.data).toEqual({ children: 2 });
        });

        test('returns null when scenario not found', async () => {
            const { service } = buildService();
            const result = await service.getScenario('user1', 'nonexistent-id');
            expect(result).toBeNull();
        });
    });

    describe('updateScenario', () => {
        test('updates name and data', async () => {
            const { service } = buildService();
            const created = await service.createScenario('user1', {
                name: 'Original',
                data: { v: 1 }
            });

            const updated = await service.updateScenario('user1', created.id, {
                name: 'Renamed',
                data: { v: 2 }
            });

            expect(updated.name).toBe('Renamed');
            expect(updated.data).toEqual({ v: 2 });
        });

        test('returns null when scenario does not exist', async () => {
            const { service } = buildService();
            const result = await service.updateScenario('user1', 'ghost', { name: 'X' });
            expect(result).toBeNull();
        });

        test('throws conflict error when etag mismatches', async () => {
            const { service, storage } = buildService();
            const created = await service.createScenario('user1', {
                name: 'Original',
                data: {}
            });

            // Simulate the stored entity having a different etag
            const storedKey = `user1::${created.id}`;
            const stored = storage._store.get(storedKey);
            storage._store.set(storedKey, { ...stored, etag: 'etag-server' });

            await expect(
                service.updateScenario('user1', created.id, {
                    name: 'Updated',
                    etag: 'etag-stale-client'
                })
            ).rejects.toMatchObject({ conflict: true });
        });

        test('skips etag check when etag is wildcard "*"', async () => {
            const { service, storage } = buildService();
            const created = await service.createScenario('user1', {
                name: 'Original',
                data: {}
            });

            const storedKey = `user1::${created.id}`;
            const stored = storage._store.get(storedKey);
            storage._store.set(storedKey, { ...stored, etag: 'etag-server' });

            const result = await service.updateScenario('user1', created.id, {
                name: 'Forced Update',
                etag: '*'
            });
            expect(result.name).toBe('Forced Update');
        });
    });

    describe('deleteScenario', () => {
        test('returns true on successful delete', async () => {
            const { service } = buildService();
            const created = await service.createScenario('user1', { name: 'To Delete', data: {} });
            const result = await service.deleteScenario('user1', created.id);
            expect(result).toBe(true);
        });

        test('returns false when scenario not found', async () => {
            const { service } = buildService();
            const result = await service.deleteScenario('user1', 'nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('setActiveScenario', () => {
        test('returns false when scenario not found', async () => {
            const { service } = buildService();
            const result = await service.setActiveScenario('user1', 'ghost');
            expect(result).toBe(false);
        });

        test('marks the scenario as active', async () => {
            const { service } = buildService();
            const s1 = await service.createScenario('user1', {
                name: 'S1',
                data: {},
                isActive: false
            });

            const result = await service.setActiveScenario('user1', s1.id);
            expect(result).toBe(true);
        });
    });
});
