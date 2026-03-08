/**
 * Storage Manager
 * Unified interface for local and cloud storage.
 * Handles fallback, auto-save, sync, and conflict resolution.
 */

import { authManager } from '../auth/auth-manager.js';
import { loadState, saveState } from './persistence.js';
import { debounce } from '../utils/debounce.js';

class StorageManager {
  constructor() {
    this.cloudStorageAvailable = false;
    this.autoSaving = false;
    this.lastSavedState = null;
    this.queuedSave = null;

    // Auto-save debounced (3 seconds)
    this.debouncedSave = debounce(
      (state) => this.saveScenario(state),
      3000
    );
  }

  /**
   * Initialize storage manager.
   * Checks auth status and cloud availability, then syncs if authenticated.
   * @returns {Promise<boolean>} Whether cloud storage is available
   */
  async initialize() {
    const user = await authManager.checkAuth();
    this.cloudStorageAvailable = user !== null;

    if (this.cloudStorageAvailable) {
      console.log('Cloud storage available');
      await this.syncWithCloud();
    } else {
      console.log('Using local storage only');
    }

    return this.cloudStorageAvailable;
  }

  /**
   * Load the active scenario.
   * Tries cloud first, falls back to localStorage.
   * @returns {Promise<Object|null>} The loaded state, or null
   */
  async loadActiveScenario() {
    try {
      if (this.cloudStorageAvailable) {
        const response = await fetch('/api/user/profile', {
          credentials: 'same-origin'
        });

        if (response.ok) {
          const profile = await response.json();

          if (profile.activeScenarioId) {
            const scenario = await this.loadScenario(profile.activeScenarioId);
            if (scenario) {
              return scenario.data;
            }
          }
        }
      }

      // Fallback to localStorage
      return loadState();
    } catch (error) {
      console.error('Error loading scenario:', error);
      return loadState(); // Always fallback to localStorage
    }
  }

  /**
   * Load a specific scenario by ID from cloud.
   * @param {string} scenarioId - The scenario ID to load
   * @returns {Promise<Object|null>} The scenario object, or null
   */
  async loadScenario(scenarioId) {
    if (!this.cloudStorageAvailable) {
      return null;
    }

    try {
      const response = await fetch(`/api/scenarios/${encodeURIComponent(scenarioId)}`, {
        credentials: 'same-origin'
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Error loading scenario:', error);
      return null;
    }
  }

  /**
   * Save a scenario to localStorage and, if authenticated, to cloud.
   * @param {Object} state - The state to save
   * @param {string} [scenarioName='My Scenario'] - The scenario name for cloud storage
   * @returns {Promise<Object|undefined>} The saved scenario result from cloud, or undefined
   */
  async saveScenario(state, scenarioName = 'My Scenario') {
    // Always save to localStorage first (instant, no network dependency)
    saveState(state);
    this.lastSavedState = state;

    // If authenticated, also save to cloud
    if (this.cloudStorageAvailable) {
      try {
        const profile = await this.getUserProfile();
        const scenarioId = profile && profile.activeScenarioId;

        const scenarioData = {
          name: scenarioName,
          data: state,
          isActive: true
        };

        let response;

        if (scenarioId) {
          // Update existing scenario
          response = await fetch(`/api/scenarios/${encodeURIComponent(scenarioId)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(scenarioData)
          });
        } else {
          // Create new scenario
          response = await fetch('/api/scenarios', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(scenarioData)
          });
        }

        if (response.ok) {
          const result = await response.json();
          this.updateSyncStatus('synced');
          return result;
        } else if (response.status === 409) {
          // Conflict — server wins
          const conflict = await response.json();
          await this.handleConflict(conflict);
        } else {
          this.updateSyncStatus('error');
        }
      } catch (error) {
        console.error('Error saving to cloud:', error);
        this.updateSyncStatus('error');
      }
    }
  }

  /**
   * Trigger auto-save on field changes (debounced 3s).
   * Shows saving indicator immediately, then saves after the debounce period.
   * @param {Object} state - The current form state to save
   */
  autoSave(state) {
    this.updateSyncStatus('saving');
    this.debouncedSave(state);
  }

  /**
   * List all user scenarios from cloud.
   * @returns {Promise<Array>} Array of scenario objects, or empty array
   */
  async listScenarios() {
    if (!this.cloudStorageAvailable) {
      return [];
    }

    try {
      const response = await fetch('/api/scenarios', {
        credentials: 'same-origin'
      });

      if (response.ok) {
        const result = await response.json();
        return result.scenarios;
      }

      return [];
    } catch (error) {
      console.error('Error listing scenarios:', error);
      return [];
    }
  }

  /**
   * Delete a scenario from cloud.
   * @param {string} scenarioId - The scenario ID to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  async deleteScenario(scenarioId) {
    if (!this.cloudStorageAvailable) {
      return false;
    }

    try {
      const response = await fetch(`/api/scenarios/${encodeURIComponent(scenarioId)}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting scenario:', error);
      return false;
    }
  }

  /**
   * Get the current user's profile from the API.
   * @returns {Promise<Object|null>} The user profile object, or null
   */
  async getUserProfile() {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'same-origin'
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * Sync local storage with cloud data after login.
   * Compares timestamps and uses the most recent version.
   * On first login (no cloud data), uploads local data.
   */
  async syncWithCloud() {
    try {
      // Load local data
      const localState = loadState();

      // Load cloud data (call loadActiveScenario directly to avoid recursion;
      // cloudStorageAvailable is already true at this point)
      let cloudState = null;
      try {
        const profileResponse = await fetch('/api/user/profile', {
          credentials: 'same-origin'
        });

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          if (profile.activeScenarioId) {
            const scenario = await this.loadScenario(profile.activeScenarioId);
            if (scenario) {
              cloudState = scenario.data;
            }
          }
        }
      } catch (fetchError) {
        // Re-throw so the outer catch can set error status
        throw fetchError;
      }

      if (!cloudState && localState) {
        // No cloud data — upload local data (first login migration)
        await this.saveScenario(localState, 'Imported from device');
        this.updateSyncStatus('synced');
      } else if (cloudState && !localState) {
        // No local data — download cloud data
        saveState(cloudState);
        this.updateSyncStatus('synced');
      } else if (cloudState && localState) {
        // Both exist — use most recent based on timestamp
        // Check both top-level timestamp and metadata.lastModified for compatibility
        const localTimestamp = new Date(localState.timestamp || localState.metadata?.lastModified || 0);
        const cloudTimestamp = new Date(cloudState.timestamp || cloudState.metadata?.lastModified || 0);

        if (localTimestamp > cloudTimestamp) {
          // Local is newer, upload to cloud
          await this.saveScenario(localState, 'Synced from device');
        } else {
          // Cloud is newer, update local
          saveState(cloudState);
        }

        this.updateSyncStatus('synced');
      }
    } catch (error) {
      console.error('Sync error:', error);
      this.updateSyncStatus('error');
    }
  }

  /**
   * Handle a save conflict (409 response).
   * Uses "server wins" strategy — replaces local data with server version.
   * @param {Object} conflict - The conflict object from the API response
   */
  async handleConflict(conflict) {
    // Server wins strategy — future enhancement could offer user choice
    console.warn('Conflict detected, using server version');
    saveState(conflict.serverVersion.data);
    this.updateSyncStatus('conflictResolved');
  }

  /**
   * Update the sync status indicator in the UI.
   * @param {string} status - One of: 'saving', 'synced', 'error', 'conflictResolved'
   */
  updateSyncStatus(status) {
    const syncStatusEl = document.getElementById('sync-status');
    if (!syncStatusEl) return;

    // Remove all state classes then apply the current one
    syncStatusEl.classList.remove('saving', 'synced', 'error');

    const syncIcon = syncStatusEl.querySelector('.sync-icon');
    const syncText = syncStatusEl.querySelector('.sync-text');

    switch (status) {
      case 'saving':
        syncStatusEl.classList.add('saving');
        if (syncIcon) syncIcon.textContent = '⏳';
        if (syncText) syncText.textContent = 'Saving...';
        break;
      case 'synced':
        syncStatusEl.classList.add('synced');
        if (syncIcon) syncIcon.textContent = '☁️';
        if (syncText) syncText.textContent = 'Synced';
        break;
      case 'error':
        syncStatusEl.classList.add('error');
        if (syncIcon) syncIcon.textContent = '⚠️';
        if (syncText) syncText.textContent = 'Sync failed';
        break;
      case 'conflictResolved':
        syncStatusEl.classList.add('synced');
        if (syncIcon) syncIcon.textContent = '🔄';
        if (syncText) syncText.textContent = 'Conflict resolved';
        break;
      default:
        break;
    }
  }
}

// Singleton instance
export const storageManager = new StorageManager();
