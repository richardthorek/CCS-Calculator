/**
 * Theme Toggle Module
 * Handles dark mode toggle with system preference detection and manual override
 * 
 * Supports three states:
 * - 'auto': Follow system preference (default)
 * - 'light': Force light mode
 * - 'dark': Force dark mode
 */

const THEME_STORAGE_KEY = 'ccsThemePreference';

/**
 * Get the current theme preference from localStorage
 * @returns {string} 'auto', 'light', or 'dark'
 */
function getThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved;
    }
  } catch (error) {
    console.error('Error reading theme preference:', error);
  }
  return 'auto'; // Default to auto (system preference)
}

/**
 * Save theme preference to localStorage
 * @param {string} theme - 'auto', 'light', or 'dark'
 */
function saveThemePreference(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
}

/**
 * Get the effective theme based on preference and system settings
 * @param {string} preference - 'auto', 'light', or 'dark'
 * @returns {string} 'light' or 'dark'
 */
function getEffectiveTheme(preference) {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  
  // Auto mode - use system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Apply the theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  const html = document.documentElement;
  
  if (theme === 'dark') {
    html.classList.add('dark-mode');
  } else {
    html.classList.remove('dark-mode');
  }
  
  // Update meta theme-color for browser chrome
  updateMetaThemeColor(theme);
  
  // Dispatch event for other components that might need to react
  document.dispatchEvent(new CustomEvent('themeChanged', { 
    detail: { theme } 
  }));
}

/**
 * Update the meta theme-color tag
 * @param {string} theme - 'light' or 'dark'
 */
function updateMetaThemeColor(theme) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    // Light mode: primary teal, Dark mode: dark blue-gray
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#1e293b' : '#0891b2');
  }
}

/**
 * Update the toggle button UI to reflect current state
 * @param {string} preference - 'auto', 'light', or 'dark'
 * @param {string} effectiveTheme - 'light' or 'dark'
 */
function updateToggleUI(preference, effectiveTheme) {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  
  // Update icon
  const icon = toggle.querySelector('.theme-toggle-icon');
  if (icon) {
    if (preference === 'auto') {
      icon.textContent = effectiveTheme === 'dark' ? '🌙' : '☀️';
    } else if (preference === 'dark') {
      icon.textContent = '🌙';
    } else {
      icon.textContent = '☀️';
    }
  }
  
  // Update label
  const label = toggle.querySelector('.theme-toggle-label');
  if (label) {
    if (preference === 'auto') {
      label.textContent = `Auto (${effectiveTheme === 'dark' ? 'Dark' : 'Light'})`;
    } else if (preference === 'dark') {
      label.textContent = 'Dark';
    } else {
      label.textContent = 'Light';
    }
  }
  
  // Update aria-label for accessibility
  toggle.setAttribute('aria-label', 
    `Theme: ${preference === 'auto' ? `Auto (currently ${effectiveTheme})` : preference}. Click to change.`
  );
}

/**
 * Cycle to the next theme preference
 * @param {string} currentPreference - Current preference
 * @returns {string} Next preference
 */
function getNextTheme(currentPreference) {
  // Cycle: auto -> light -> dark -> auto
  if (currentPreference === 'auto') return 'light';
  if (currentPreference === 'light') return 'dark';
  return 'auto';
}

/**
 * Initialize the theme system
 */
export function initializeTheme() {
  // Get saved preference
  const preference = getThemePreference();
  const effectiveTheme = getEffectiveTheme(preference);
  
  // Apply theme immediately (before page renders)
  applyTheme(effectiveTheme);
  
  // Update toggle UI if it exists
  updateToggleUI(preference, effectiveTheme);
  
  // Listen for system preference changes (when in auto mode)
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const currentPreference = getThemePreference();
      if (currentPreference === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
        updateToggleUI('auto', newTheme);
      }
    });
  }
  
  console.log(`Theme initialized: preference=${preference}, effective=${effectiveTheme}`);
}

/**
 * Initialize the theme toggle button
 */
export function initializeThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    console.warn('Theme toggle button not found');
    return;
  }
  
  // Get current state
  let preference = getThemePreference();
  let effectiveTheme = getEffectiveTheme(preference);
  
  // Update UI
  updateToggleUI(preference, effectiveTheme);
  
  // Handle click
  toggle.addEventListener('click', () => {
    // Cycle to next theme
    preference = getNextTheme(preference);
    effectiveTheme = getEffectiveTheme(preference);
    
    // Save preference
    saveThemePreference(preference);
    
    // Apply theme
    applyTheme(effectiveTheme);
    
    // Update UI
    updateToggleUI(preference, effectiveTheme);
    
    console.log(`Theme changed: preference=${preference}, effective=${effectiveTheme}`);
  });
  
  console.log('Theme toggle initialized');
}

/**
 * Create theme toggle button element
 * @returns {HTMLElement} The theme toggle button
 */
export function createThemeToggle() {
  const button = document.createElement('button');
  button.id = 'theme-toggle';
  button.className = 'theme-toggle';
  button.type = 'button';
  button.setAttribute('aria-label', 'Toggle theme');
  
  const icon = document.createElement('span');
  icon.className = 'theme-toggle-icon';
  icon.textContent = '☀️';
  icon.setAttribute('aria-hidden', 'true');
  
  const label = document.createElement('span');
  label.className = 'theme-toggle-label';
  label.textContent = 'Auto';
  
  button.appendChild(icon);
  button.appendChild(label);
  
  return button;
}
