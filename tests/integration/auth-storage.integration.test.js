/**
 * Phase 8.6 integration tests
 * Covers auth flow, save/load, auto-save, sync, conflict handling, and fallback behavior.
 */

import { authManager } from '../../src/js/auth/auth-manager.js';
import { storageManager } from '../../src/js/storage/storage-manager.js';
import { jest } from '@jest/globals';

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

const syncIconEl = { textContent: '' };
const syncTextEl = { textContent: '' };
const syncStatusEl = {
  classList: {
    _classes: new Set(),
    add(cls) { this._classes.add(cls); },
    remove(...clss) { clss.forEach(c => this._classes.delete(c)); }
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

global.window = {
  location: {
    pathname: '/calculator',
    href: ''
  }
};

function mockResponse(ok, status, data) {
  return { ok, status, json: async () => data };
}

class FetchMock {
  constructor() {
    this._queue = [];
  }

  enqueue(response) {
    this._queue.push(response);
    return this;
  }

  handler() {
    return () => Promise.resolve(this._queue.shift() || mockResponse(false, 404, {}));
  }

  reset() {
    this._queue = [];
  }
}

const fetchMock = new FetchMock();

describe('Phase 8.6 auth + storage integration', () => {
  beforeAll(() => {
    global.fetch = (...args) => fetchMock.handler()(...args);
  });

  beforeEach(() => {
    localStorage.clear();
    fetchMock.reset();
    authManager.clearCache();
    storageManager.cloudStorageAvailable = false;
    storageManager.lastSavedState = null;
    storageManager.activeScenarioId = null;
    storageManager.activeScenarioName = 'My Scenario';
    syncIconEl.textContent = '';
    syncTextEl.textContent = '';
    syncStatusEl.classList._classes.clear();
    window.location.href = '';
  });

  test('completes authentication flow and constructs provider login/logout redirects', async () => {
    fetchMock.enqueue(mockResponse(true, 200, { clientPrincipal: null }));
    const anonymousUser = await authManager.checkAuth();
    expect(anonymousUser).toBeNull();
    expect(authManager.isAuthenticated()).toBe(false);

    authManager.clearCache();
    fetchMock.enqueue(mockResponse(true, 200, {
      clientPrincipal: {
        userId: 'user-1',
        userDetails: 'parent@example.com',
        identityProvider: 'github',
        userRoles: ['authenticated']
      }
    }));

    const user = await authManager.checkAuth();
    expect(user).toBeDefined();
    expect(user.id).toBe('user-1');
    expect(authManager.isAuthenticated()).toBe(true);

    authManager.login('github', '/calculator');
    expect(window.location.href).toContain('/.auth/login/github');

    authManager.logout('/');
    expect(window.location.href).toContain('/.auth/logout');
  });

  test('completes scenario save/load cycle via cloud APIs', async () => {
    storageManager.cloudStorageAvailable = true;
    const state = {
      formData: { parent1: { income: 101000 } },
      timestamp: new Date().toISOString()
    };

    fetchMock
      .enqueue(mockResponse(true, 200, { activeScenarioId: null }))
      .enqueue(mockResponse(true, 200, { id: 'scenario-1' }))
      .enqueue(mockResponse(true, 200, { activeScenarioId: 'scenario-1' }))
      .enqueue(mockResponse(true, 200, { data: state }));

    await storageManager.saveScenario(state, 'Scenario 1');
    const loaded = await storageManager.loadActiveScenario();

    expect(loaded).toEqual(state);
    expect(syncTextEl.textContent).toBe('Synced');
  });

  test('debounces auto-save and saves after 3 seconds', async () => {
    jest.useFakeTimers();
    const state = {
      formData: { parent1: { income: 88000 } },
      timestamp: new Date().toISOString()
    };

    const saveSpy = jest.spyOn(storageManager, 'saveScenario').mockResolvedValue(undefined);
    storageManager.autoSave(state);
    expect(syncTextEl.textContent).toBe('Saving...');
    expect(saveSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(3000);
    await Promise.resolve();

    expect(saveSpy).toHaveBeenCalledWith(state);

    saveSpy.mockRestore();
    jest.useRealTimers();
  });

  test('syncs local state to cloud after login and handles conflicts and fallback', async () => {
    const localState = {
      formData: { parent1: { income: 77000 } },
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('ccsCalculator', JSON.stringify({
      version: 1,
      state: localState,
      timestamp: new Date().toISOString()
    }));

    storageManager.cloudStorageAvailable = true;

    fetchMock
      .enqueue(mockResponse(true, 200, { activeScenarioId: null }))
      .enqueue(mockResponse(true, 200, { activeScenarioId: null }))
      .enqueue(mockResponse(true, 200, { id: 'new-id' }));

    await storageManager.syncWithCloud();
    expect(syncTextEl.textContent).toBe('Synced');

    const serverState = {
      formData: { parent1: { income: 99000 } },
      timestamp: new Date().toISOString()
    };

    fetchMock
      // With activeScenarioId cached as 'new-id' from syncWithCloud above,
      // getUserProfile is skipped and PUT goes directly to the cached scenario
      .enqueue(mockResponse(false, 409, { serverVersion: { data: serverState } }));

    await storageManager.saveScenario(localState, 'Scenario');
    const conflictResolvedState = JSON.parse(localStorage.getItem('ccsCalculator'));
    expect(conflictResolvedState.state.formData.parent1.income).toBe(99000);
    expect(syncTextEl.textContent).toBe('Conflict resolved');

    global.fetch = () => Promise.reject(new Error('Network error'));
    const fallbackLoaded = await storageManager.loadActiveScenario();
    expect(fallbackLoaded.formData.parent1.income).toBe(99000);
    global.fetch = (...args) => fetchMock.handler()(...args);
  });
});
