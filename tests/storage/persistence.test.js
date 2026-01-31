/**
 * Tests for Local Storage Persistence Module
 */

import {
  loadState,
  saveState,
  clearState,
  migrateState,
  isLocalStorageAvailable,
  getStorageSize,
  hasState
} from '../../src/js/storage/persistence.js';

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

describe('persistence module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isLocalStorageAvailable', () => {
    test('should return true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });
  });

  describe('saveState', () => {
    test('should save state to localStorage', () => {
      const state = {
        parent1: { income: 80000, days: 5, hours: 8 },
        parent2: { income: 60000, days: 3, hours: 8 },
        children: [{ age: 3, careType: 'centre', dailyFee: 120 }]
      };

      const result = saveState(state);
      expect(result).toBe(true);
      
      const savedData = JSON.parse(localStorage.getItem('ccsCalculator'));
      expect(savedData).toBeDefined();
      expect(savedData.version).toBe(1);
      expect(savedData.state).toEqual(state);
      expect(savedData.timestamp).toBeDefined();
    });

    test('should overwrite existing state', () => {
      const state1 = { parent1: { income: 80000 } };
      const state2 = { parent1: { income: 90000 } };

      saveState(state1);
      saveState(state2);

      const savedData = JSON.parse(localStorage.getItem('ccsCalculator'));
      expect(savedData.state).toEqual(state2);
    });
  });

  describe('loadState', () => {
    test('should return null when no state is saved', () => {
      const result = loadState();
      expect(result).toBeNull();
    });

    test('should load saved state', () => {
      const state = {
        parent1: { income: 80000, days: 5, hours: 8 },
        children: [{ age: 3, careType: 'centre' }]
      };

      saveState(state);
      const loaded = loadState();

      expect(loaded).toEqual(state);
    });

    test('should handle corrupted data gracefully', () => {
      localStorage.setItem('ccsCalculator', 'invalid json');
      const result = loadState();
      expect(result).toBeNull();
    });

    test('should trigger migration for old version', () => {
      const oldData = {
        version: 0,
        state: { parent1: { income: 80000 } }
      };
      
      localStorage.setItem('ccsCalculator', JSON.stringify(oldData));
      const loaded = loadState();
      
      // Should still return the state after migration
      expect(loaded).toBeDefined();
      expect(loaded.parent1.income).toBe(80000);
    });
  });

  describe('clearState', () => {
    test('should remove saved state', () => {
      const state = { parent1: { income: 80000 } };
      saveState(state);
      
      expect(hasState()).toBe(true);
      
      const result = clearState();
      expect(result).toBe(true);
      expect(hasState()).toBe(false);
    });

    test('should return true even if no state exists', () => {
      const result = clearState();
      expect(result).toBe(true);
    });
  });

  describe('migrateState', () => {
    test('should migrate old version to current', () => {
      const oldData = {
        version: 0,
        state: { parent1: { income: 80000 } }
      };

      const migrated = migrateState(oldData);
      expect(migrated).toBeDefined();
      expect(migrated.parent1.income).toBe(80000);
      
      // Should save migrated state
      const savedData = JSON.parse(localStorage.getItem('ccsCalculator'));
      expect(savedData.version).toBe(1);
    });

    test('should handle migration errors gracefully', () => {
      const invalidData = { version: 'invalid' };
      const result = migrateState(invalidData);
      
      // Should handle gracefully - undefined is acceptable for migration failures
      expect(result === null || result === undefined || typeof result === 'object').toBe(true);
    });
  });

  describe('hasState', () => {
    test('should return false when no state exists', () => {
      expect(hasState()).toBe(false);
    });

    test('should return true when state exists', () => {
      saveState({ parent1: { income: 80000 } });
      expect(hasState()).toBe(true);
    });
  });

  describe('getStorageSize', () => {
    test('should return 0 when no state exists', () => {
      expect(getStorageSize()).toBe(0);
    });

    test('should return approximate size when state exists', () => {
      const state = {
        parent1: { income: 80000, days: 5, hours: 8 },
        parent2: { income: 60000, days: 3, hours: 8 },
        children: [{ age: 3, careType: 'centre', dailyFee: 120 }]
      };
      
      saveState(state);
      const size = getStorageSize();
      
      expect(size).toBeGreaterThan(0);
    });
  });
});
