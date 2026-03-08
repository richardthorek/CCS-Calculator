'use strict';

/**
 * User Profile Service
 *
 * Manages user profile entities in Azure Table Storage.
 *
 * Table: userprofiles (TABLE_NAME_PROFILES env var)
 *   PartitionKey: userId
 *   RowKey:       "profile"
 */

const { createTableStorageService } = require('./table-storage');

const TABLE_NAME = process.env.TABLE_NAME_PROFILES || 'userprofiles';

/**
 * Default profile structure applied when creating a new profile.
 */
const DEFAULT_PREFERENCES = JSON.stringify({
    theme: 'light',
    defaultPeriod: 'fortnightly'
});

class UserProfileService {
    /**
     * @param {import('./table-storage').TableStorageService} storageService
     */
    constructor(storageService) {
        this._storage = storageService;
    }

    /**
     * Retrieve a user's profile.
     *
     * @param {string} userId
     * @returns {Promise<object|null>} Profile object, or null if not found
     */
    async getUserProfile(userId) {
        const entity = await this._storage.getEntity(TABLE_NAME, userId, 'profile');
        if (!entity) {
            return null;
        }
        return this._toProfile(entity);
    }

    /**
     * Create a new user profile with sensible defaults.
     *
     * @param {string} userId
     * @param {object} profileData
     * @param {string} [profileData.email]
     * @param {string} [profileData.displayName]
     * @param {string} [profileData.preferences] - JSON string
     * @returns {Promise<object>} The created profile
     */
    async createUserProfile(userId, profileData = {}) {
        const now = new Date().toISOString();
        const entity = {
            partitionKey: userId,
            rowKey: 'profile',
            email: profileData.email || '',
            displayName: profileData.displayName || '',
            preferences: profileData.preferences || DEFAULT_PREFERENCES,
            lastSyncTimestamp: now,
            activeScenarioId: profileData.activeScenarioId || '',
            createdAt: now
        };

        await this._storage.createEntity(TABLE_NAME, entity);
        return this._toProfile(entity);
    }

    /**
     * Update mutable fields on an existing user profile.
     * Creates the profile first if it does not exist.
     *
     * @param {string} userId
     * @param {object} updates
     * @param {string} [updates.preferences]      - JSON string
     * @param {string} [updates.activeScenarioId]
     * @param {string} [updates.displayName]
     * @returns {Promise<object>} The updated profile
     */
    async updateUserProfile(userId, updates) {
        let existing = await this._storage.getEntity(TABLE_NAME, userId, 'profile');

        if (!existing) {
            return this.createUserProfile(userId, updates);
        }

        const merged = {
            ...existing,
            lastSyncTimestamp: new Date().toISOString()
        };

        if (updates.preferences !== undefined) {
            merged.preferences = updates.preferences;
        }
        if (updates.activeScenarioId !== undefined) {
            merged.activeScenarioId = updates.activeScenarioId;
        }
        if (updates.displayName !== undefined) {
            merged.displayName = updates.displayName;
        }

        const updated = await this._storage.updateEntity(TABLE_NAME, merged);
        return this._toProfile(updated);
    }

    /**
     * Map a raw Table Storage entity to a clean profile object.
     *
     * @private
     * @param {object} entity
     * @returns {object}
     */
    _toProfile(entity) {
        let preferences = {};
        try {
            preferences = JSON.parse(entity.preferences || '{}');
        } catch {
            preferences = {};
        }

        return {
            userId: entity.partitionKey,
            email: entity.email || '',
            displayName: entity.displayName || '',
            preferences,
            lastSyncTimestamp: entity.lastSyncTimestamp || null,
            activeScenarioId: entity.activeScenarioId || null,
            createdAt: entity.createdAt || null
        };
    }
}

/**
 * Factory – creates a UserProfileService backed by Table Storage.
 *
 * @param {import('./table-storage').TableStorageService} [storageService]
 * @returns {UserProfileService}
 */
function createUserProfileService(storageService) {
    const storage = storageService || createTableStorageService();
    return new UserProfileService(storage);
}

module.exports = { UserProfileService, createUserProfileService };
