/**
 * Tests for Storage Manager Module
 */

import { storageManager } from '../../src/js/storage/storage-manager.js';
import { authManager } from '../../src/js/auth/auth-manager.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;

global.Blob = class Blob {
  constructor(parts) {
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
  }
};

// Mock document for sync status UI
const syncIconEl = { textContent: '' };
const syncTextEl = { textContent: '' };
const syncStatusEl = {
  classList: {
    _classes: new Set(),
    add(cls) { this._classes.add(cls); },
    remove(...clss) { clss.forEach(c => this._classes.delete(c)); },
    contains(cls) { return this._classes.has(cls); }
  },
  querySelector: (selector) => {
    if (selector === '.sync-icon') return syncIconEl;
    if (selector === '.sync-text') return syncTextEl;
    return null;
  }
};

global.document = {
  getElementById: (id) => (id === 'sync-status' ? syncStatusEl : null)
};

/** Helper: build a mock Response-like object */
function mockResponse(ok, status, data) {
  return { ok, status, json: async () => data };
}

/** Fetch mock queue - responses are consumed in order per URL pattern */
class FetchMock {
  constructor() {
    this._queue = [];
    this._default = mockResponse(false, 404, {});
  }

  enqueue(response) {
    this._queue.push(response);
    return this;
  }

  setDefault(response) {
    this._default = response;
    return this;
  }

  handler() {
    return (_url, _options) => {
      const res = this._queue.length > 0 ? this._queue.shift() : this._default;
      return Promise.resolve(res);
    };
  }

  reset() {
    this._queue = [];
    this._default = mockResponse(false, 404, {});
  }
}

const fetchMock = new FetchMock();

describe('StorageManager', () => {
  beforeAll(() => {
    global.fetch = (...args) => fetchMock.handler()(...args);
  });

  beforeEach(() => {
    localStorage.clear();
    fetchMock.reset();
    // Reset auth manager cache so each test starts fresh
    authManager.clearCache();
    // Reset storage manager state
    storageManager.cloudStorageAvailable = false;
    storageManager.lastSavedState = null;
    syncStatusEl.classList._classes.clear();
    syncIconEl.textContent = '';
    syncTextEl.textContent = '';
  });

  describe('initialize()', () => {
    test('should set cloudStorageAvailable to false when not authenticated', async () => {
      fetchMock.enqueue(mockResponse(true, 200, { clientPrincipal: null }));
      const result = await storageManager.initialize();
      expect(result).toBe(false);
      expect(storageManager.cloudStorageAvailable).toBe(false);
    });

    test('should set cloudStorageAvailable to true when authenticated', async () => {
      fetchMock
        // /.auth/me - authenticated user
        .enqueue(mockResponse(true, 200, {
          clientPrincipal: { userId: 'u1', userDetails: 'a@b.com', identityProvider: 'aad', userRoles: ['authenticated'] }
        }))
        // syncWithCloud: GET /api/user/profile
        .enqueue(mockResponse(false, 401, {}));

      const result = await storageManager.initialize();
      expect(result).toBe(true);
      expect(storageManager.cloudStorageAvailable).toBe(true);
    });
  });

  describe('updateSyncStatus()', () => {
    test('should update icon and text to "Saving..." for saving status', () => {
      storageManager.updateSyncStatus('saving');
      expect(syncIconEl.textContent).toBe('⏳');
      expect(syncTextEl.textContent).toBe('Saving...');
      expect(syncStatusEl.classList.contains('saving')).toBe(true);
    });

    test('should update icon and text to "Synced" for synced status', () => {
      storageManager.updateSyncStatus('synced');
      expect(syncIconEl.textContent).toBe('☁️');
      expect(syncTextEl.textContent).toBe('Synced');
      expect(syncStatusEl.classList.contains('synced')).toBe(true);
    });

    test('should update icon and text to "Sync failed" for error status', () => {
      storageManager.updateSyncStatus('error');
      expect(syncIconEl.textContent).toBe('⚠️');
      expect(syncTextEl.textContent).toBe('Sync failed');
      expect(syncStatusEl.classList.contains('error')).toBe(true);
    });

    test('should update icon and text for conflictResolved status', () => {
      storageManager.updateSyncStatus('conflictResolved');
      expect(syncIconEl.textContent).toBe('🔄');
      expect(syncTextEl.textContent).toBe('Conflict resolved');
      expect(syncStatusEl.classList.contains('synced')).toBe(true);
    });

    test('should remove previous state classes before applying new one', () => {
      storageManager.updateSyncStatus('error');
      expect(syncStatusEl.classList.contains('error')).toBe(true);
      storageManager.updateSyncStatus('synced');
      expect(syncStatusEl.classList.contains('error')).toBe(false);
      expect(syncStatusEl.classList.contains('synced')).toBe(true);
    });

    test('should not throw when sync-status element is absent', () => {
      const original = global.document.getElementById;
      global.document.getElementById = () => null;
      expect(() => storageManager.updateSyncStatus('synced')).not.toThrow();
      global.document.getElementById = original;
    });
  });

  describe('autoSave()', () => {
    test('should set sync status to saving and queue debounced save', () => {
      const state = { formData: { parent1: { income: 80000 } } };
      storageManager.autoSave(state);
      expect(syncTextEl.textContent).toBe('Saving...');
    });
  });

  describe('loadActiveScenario()', () => {
    test('should return localStorage state when cloud is not available', async () => {
      storageManager.cloudStorageAvailable = false;
      localStorage.setItem('ccsCalculator', JSON.stringify({
        version: 1,
        state: { formData: { parent1: { income: 90000 } } },
        timestamp: new Date().toISOString()
      }));
      const result = await storageManager.loadActiveScenario();
      expect(result).toBeDefined();
      expect(result.formData.parent1.income).toBe(90000);
    });

    test('should fallback to localStorage when cloud fetch throws', async () => {
      storageManager.cloudStorageAvailable = true;
      global.fetch = () => Promise.reject(new Error('Network error'));
      localStorage.setItem('ccsCalculator', JSON.stringify({
        version: 1,
        state: { formData: { parent1: { income: 70000 } } },
        timestamp: new Date().toISOString()
      }));
      const result = await storageManager.loadActiveScenario();
      expect(result).toBeDefined();
      expect(result.formData.parent1.income).toBe(70000);
      // Restore fetch mock
      global.fetch = (...args) => fetchMock.handler()(...args);
    });

    test('should return null when no state exists and cloud is unavailable', async () => {
      storageManager.cloudStorageAvailable = false;
      const result = await storageManager.loadActiveScenario();
      expect(result).toBeNull();
    });
  });

  describe('saveScenario()', () => {
    test('should save to localStorage even without cloud', async () => {
      storageManager.cloudStorageAvailable = false;
      const state = { formData: { parent1: { income: 100000 } }, timestamp: new Date().toISOString() };
      await storageManager.saveScenario(state);
      const saved = JSON.parse(localStorage.getItem('ccsCalculator'));
      expect(saved).toBeDefined();
      expect(storageManager.lastSavedState).toEqual(state);
    });

    test('should update sync status to synced on successful cloud save', async () => {
      storageManager.cloudStorageAvailable = true;
      const state = { formData: { parent1: { income: 50000 } }, timestamp: new Date().toISOString() };

      fetchMock
        // getUserProfile - no active scenario
        .enqueue(mockResponse(true, 200, { activeScenarioId: null }))
        // POST /api/scenarios
        .enqueue(mockResponse(true, 200, { id: 'new-id' }));

      await storageManager.saveScenario(state);
      expect(syncTextEl.textContent).toBe('Synced');
    });

    test('should update sync status to error when cloud save fails', async () => {
      storageManager.cloudStorageAvailable = true;
      const state = { formData: { parent1: { income: 50000 } }, timestamp: new Date().toISOString() };

      fetchMock
        // getUserProfile
        .enqueue(mockResponse(true, 200, { activeScenarioId: null }))
        // POST /api/scenarios - server error
        .enqueue(mockResponse(false, 500, {}));

      await storageManager.saveScenario(state);
      expect(syncTextEl.textContent).toBe('Sync failed');
    });

    test('should handle conflict (409) by applying server version', async () => {
      storageManager.cloudStorageAvailable = true;
      const state = { formData: { parent1: { income: 50000 } }, timestamp: new Date().toISOString() };
      const serverData = { formData: { parent1: { income: 60000 } }, timestamp: new Date().toISOString() };

      fetchMock
        // getUserProfile - has existing scenario
        .enqueue(mockResponse(true, 200, { activeScenarioId: 'existing-id' }))
        // PUT /api/scenarios/:id - conflict
        .enqueue(mockResponse(false, 409, { serverVersion: { data: serverData } }));

      await storageManager.saveScenario(state);
      const saved = JSON.parse(localStorage.getItem('ccsCalculator'));
      expect(saved.state.formData.parent1.income).toBe(60000);
      expect(syncTextEl.textContent).toBe('Conflict resolved');
    });
  });

  describe('listScenarios()', () => {
    test('should return empty array when cloud is unavailable', async () => {
      storageManager.cloudStorageAvailable = false;
      const result = await storageManager.listScenarios();
      expect(result).toEqual([]);
    });

    test('should return scenarios array from cloud', async () => {
      storageManager.cloudStorageAvailable = true;
      const scenarios = [{ id: '1', name: 'Scenario 1' }, { id: '2', name: 'Scenario 2' }];
      fetchMock.enqueue(mockResponse(true, 200, { scenarios }));
      const result = await storageManager.listScenarios();
      expect(result).toEqual(scenarios);
    });

    test('should return empty array on fetch error', async () => {
      storageManager.cloudStorageAvailable = true;
      global.fetch = () => Promise.reject(new Error('Network error'));
      const result = await storageManager.listScenarios();
      expect(result).toEqual([]);
      global.fetch = (...args) => fetchMock.handler()(...args);
    });
  });

  describe('deleteScenario()', () => {
    test('should return false when cloud is unavailable', async () => {
      storageManager.cloudStorageAvailable = false;
      const result = await storageManager.deleteScenario('some-id');
      expect(result).toBe(false);
    });

    test('should return true on successful delete', async () => {
      storageManager.cloudStorageAvailable = true;
      fetchMock.enqueue(mockResponse(true, 200, {}));
      const result = await storageManager.deleteScenario('some-id');
      expect(result).toBe(true);
    });

    test('should return false on failed delete', async () => {
      storageManager.cloudStorageAvailable = true;
      fetchMock.enqueue(mockResponse(false, 404, {}));
      const result = await storageManager.deleteScenario('non-existent');
      expect(result).toBe(false);
    });

    test('should URL-encode scenario ID in request', async () => {
      storageManager.cloudStorageAvailable = true;
      let capturedUrl = null;
      global.fetch = (url) => { capturedUrl = url; return Promise.resolve(mockResponse(true, 200, {})); };
      await storageManager.deleteScenario('id with spaces');
      expect(capturedUrl).toBe('/api/scenarios/id%20with%20spaces');
      global.fetch = (...args) => fetchMock.handler()(...args);
    });
  });

  describe('handleConflict()', () => {
    test('should save server version to localStorage', async () => {
      const serverData = { formData: { parent1: { income: 75000 } }, timestamp: new Date().toISOString() };
      await storageManager.handleConflict({ serverVersion: { data: serverData } });
      const saved = JSON.parse(localStorage.getItem('ccsCalculator'));
      expect(saved.state.formData.parent1.income).toBe(75000);
      expect(syncTextEl.textContent).toBe('Conflict resolved');
    });
  });

  describe('syncWithCloud()', () => {
    test('should upload local data to cloud when no cloud data exists', async () => {
      storageManager.cloudStorageAvailable = true;
      const localData = {
        formData: { parent1: { income: 80000 } },
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('ccsCalculator', JSON.stringify({
        version: 1,
        state: localData,
        timestamp: new Date().toISOString()
      }));

      fetchMock
        // Profile response - no active scenario
        .enqueue(mockResponse(true, 200, { activeScenarioId: null }))
        // saveScenario: getUserProfile
        .enqueue(mockResponse(true, 200, { activeScenarioId: null }))
        // saveScenario: POST /api/scenarios
        .enqueue(mockResponse(true, 200, { id: 'new-id' }));

      await storageManager.syncWithCloud();
      expect(syncTextEl.textContent).toBe('Synced');
    });

    test('should save cloud data locally when no local data exists', async () => {
      storageManager.cloudStorageAvailable = true;
      localStorage.clear();

      const cloudData = { formData: { parent1: { income: 90000 } }, timestamp: new Date().toISOString() };

      fetchMock
        // Profile - has active scenario
        .enqueue(mockResponse(true, 200, { activeScenarioId: 'cloud-id' }))
        // loadScenario
        .enqueue(mockResponse(true, 200, { data: cloudData }));

      await storageManager.syncWithCloud();
      const saved = JSON.parse(localStorage.getItem('ccsCalculator'));
      expect(saved.state.formData.parent1.income).toBe(90000);
      expect(syncTextEl.textContent).toBe('Synced');
    });

    test('should set error status when sync fails', async () => {
      storageManager.cloudStorageAvailable = true;
      global.fetch = () => Promise.reject(new Error('Network error'));
      await storageManager.syncWithCloud();
      expect(syncTextEl.textContent).toBe('Sync failed');
      global.fetch = (...args) => fetchMock.handler()(...args);
    });
  });
});
