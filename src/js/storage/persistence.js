/**
 * Local Storage Persistence Module
 * Handles saving and loading user data to/from browser localStorage
 * 
 * Privacy: All data is stored locally on the user's device only.
 * Nothing is sent to external servers (except for calculation processing).
 * 
 * Schema Version: v1
 */

const STORAGE_KEY = 'ccsCalculator';
const SCHEMA_VERSION = 1;

/**
 * Load state from localStorage
 * @returns {Object|null} The saved state or null if not found
 */
export function loadState() {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return null;
    }
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (!savedData) {
      return null;
    }
    
    const parsedData = JSON.parse(savedData);
    
    // Check if migration is needed
    if (parsedData.version !== SCHEMA_VERSION) {
      return migrateState(parsedData);
    }
    
    return parsedData.state;
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return null;
  }
}

/**
 * Save state to localStorage
 * @param {Object} state - The state to save
 * @returns {boolean} True if save was successful, false otherwise
 */
export function saveState(state) {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }
    
    const dataToSave = {
      version: SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      state: state
    };
    
    const serialized = JSON.stringify(dataToSave);
    localStorage.setItem(STORAGE_KEY, serialized);
    
    return true;
  } catch (error) {
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      // Optionally notify user
      return false;
    }
    
    console.error('Error saving state to localStorage:', error);
    return false;
  }
}

/**
 * Clear all saved state from localStorage
 * @returns {boolean} True if clear was successful, false otherwise
 */
export function clearState() {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing state from localStorage:', error);
    return false;
  }
}

/**
 * Migrate old state to current schema version
 * @param {Object} oldData - The old data with version info
 * @returns {Object|null} The migrated state or null if migration failed
 */
export function migrateState(oldData) {
  try {
    const oldVersion = oldData.version || 0;
    let migratedState = oldData.state;
    
    // Future migrations would go here
    // For example:
    // if (oldVersion < 2) {
    //   migratedState = migrateV1toV2(migratedState);
    // }
    // if (oldVersion < 3) {
    //   migratedState = migrateV2toV3(migratedState);
    // }
    
    console.log(`Migrated state from version ${oldVersion} to ${SCHEMA_VERSION}`);
    
    // Save the migrated state
    saveState(migratedState);
    
    return migratedState;
  } catch (error) {
    console.error('Error migrating state:', error);
    return null;
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available and writable
 */
export function isLocalStorageAvailable() {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the current storage size in bytes (approximate)
 * @returns {number} Approximate size of stored data in bytes
 */
export function getStorageSize() {
  try {
    if (!isLocalStorageAvailable()) {
      return 0;
    }
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? new Blob([savedData]).size : 0;
  } catch (error) {
    console.error('Error getting storage size:', error);
    return 0;
  }
}

/**
 * Check if state exists in localStorage
 * @returns {boolean} True if saved state exists
 */
export function hasState() {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}
