/**
 * Authentication Manager
 * Handles user authentication state using Azure Static Web Apps built-in auth.
 * Supports Microsoft (Entra ID) and GitHub providers.
 */

class AuthManager {
  constructor() {
    /** @type {Object|null} Current authenticated user */
    this.user = null;
    /** @type {Promise|null} Cached auth check promise to avoid duplicate requests */
    this.authCheckPromise = null;
  }

  /**
   * Check if the user is authenticated by querying the SWA /.auth/me endpoint.
   * Caches the result so multiple callers share a single fetch.
   * @returns {Promise<Object|null>} User object or null if not authenticated
   */
  async checkAuth() {
    if (!this.authCheckPromise) {
      this.authCheckPromise = this._fetchUserInfo();
    }
    return this.authCheckPromise;
  }

  /**
   * Fetch user info from /.auth/me and parse the response.
   * @returns {Promise<Object|null>} User object or null
   * @private
   */
  async _fetchUserInfo() {
    try {
      const response = await fetch('/.auth/me');
      const data = await response.json();

      if (data.clientPrincipal) {
        this.user = {
          id: data.clientPrincipal.userId,
          email: data.clientPrincipal.userDetails,
          provider: data.clientPrincipal.identityProvider,
          roles: data.clientPrincipal.userRoles
        };
        return this.user;
      }

      this.user = null;
      return null;
    } catch (error) {
      console.error(`Auth check failed when fetching /.auth/me: ${error.message || error}`);
      this.user = null;
      return null;
    }
  }

  /**
   * Get the currently authenticated user (synchronous, after checkAuth resolves).
   * @returns {Object|null} User object or null
   */
  getUser() {
    return this.user;
  }

  /**
   * Check whether a user is currently authenticated.
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.user !== null;
  }

  /**
   * Initiate an OAuth login with the specified provider.
   * @param {string} provider - Identity provider: 'aad' (Microsoft) or 'github'
   * @param {string} [redirectUrl] - URL to redirect to after successful login
   */
  login(provider = 'aad', redirectUrl = window.location.pathname) {
    const loginUrl = `/.auth/login/${provider}?post_login_redirect_uri=${encodeURIComponent(redirectUrl)}`;
    window.location.href = loginUrl;
  }

  /**
   * Log out the current user.
   * @param {string} [redirectUrl] - URL to redirect to after logout
   */
  logout(redirectUrl = '/') {
    const logoutUrl = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(redirectUrl)}`;
    window.location.href = logoutUrl;
  }

  /**
   * Clear the cached auth state, forcing a fresh check on next call to checkAuth().
   */
  clearCache() {
    this.authCheckPromise = null;
    this.user = null;
  }
}

// Singleton instance
export const authManager = new AuthManager();
