/**
 * Period Selector Module
 * Handles switching between weekly, fortnightly, monthly, and annual display periods
 */

// Period multipliers (from weekly base)
export const PERIOD_MULTIPLIERS = {
  weekly: 1,
  fortnightly: 2,
  monthly: 52 / 12, // ~4.33 weeks per month
  annual: 52
};

export const PERIOD_LABELS = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  annual: 'Annual'
};

// Current selected period (default to weekly)
let currentPeriod = 'weekly';

// Callbacks to notify when period changes
const periodChangeCallbacks = [];

/**
 * Get the current period
 * @returns {string} Current period key
 */
export function getCurrentPeriod() {
  return currentPeriod;
}

/**
 * Set the current period and notify all listeners
 * @param {string} period - Period key (weekly, fortnightly, monthly, annual)
 */
export function setCurrentPeriod(period) {
  if (!PERIOD_MULTIPLIERS[period]) {
    console.error('Invalid period:', period);
    return;
  }
  
  currentPeriod = period;
  
  // Save to localStorage
  try {
    localStorage.setItem('ccs-display-period', period);
  } catch (e) {
    console.warn('Could not save period preference:', e);
  }
  
  // Notify all callbacks
  periodChangeCallbacks.forEach(callback => callback(period));
  
  // Update all period-aware elements on the page
  updateAllPeriodDisplays();
}

/**
 * Register a callback for period changes
 * @param {Function} callback - Callback function(period)
 */
export function onPeriodChange(callback) {
  periodChangeCallbacks.push(callback);
}

/**
 * Convert a weekly value to the current period
 * @param {number} weeklyValue - Value in weekly terms
 * @returns {number} Value in current period
 */
export function convertToPeriod(weeklyValue, period = currentPeriod) {
  return weeklyValue * PERIOD_MULTIPLIERS[period];
}

/**
 * Get period label suffix (e.g., "/week", "/fortnight")
 * @param {string} period - Period key
 * @returns {string} Label suffix
 */
export function getPeriodSuffix(period = currentPeriod) {
  const suffixes = {
    weekly: '/week',
    fortnightly: '/fortnight',
    monthly: '/month',
    annual: '/year'
  };
  return suffixes[period] || '/week';
}

/**
 * Create a period selector element
 * @param {Object} options - Options for the selector
 * @returns {HTMLElement} Period selector element
 */
export function createPeriodSelector(options = {}) {
  const {
    id = 'period-selector',
    className = 'period-selector',
    showLabel = true,
    compact = false
  } = options;
  
  const container = document.createElement('div');
  container.className = className;
  container.id = id;
  
  if (showLabel && !compact) {
    const label = document.createElement('label');
    label.textContent = 'Show figures:';
    label.className = 'period-selector-label';
    container.appendChild(label);
  }
  
  const buttonGroup = document.createElement('div');
  buttonGroup.className = `period-selector-buttons ${compact ? 'compact' : ''}`;
  
  Object.keys(PERIOD_MULTIPLIERS).forEach(period => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `period-btn ${period === currentPeriod ? 'active' : ''}`;
    button.dataset.period = period;
    button.textContent = compact ? period.charAt(0).toUpperCase() : PERIOD_LABELS[period];
    button.title = PERIOD_LABELS[period];
    button.setAttribute('aria-pressed', period === currentPeriod);
    
    button.addEventListener('click', () => {
      setCurrentPeriod(period);
      
      // Update button states
      buttonGroup.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
        btn.setAttribute('aria-pressed', btn.dataset.period === period);
      });
    });
    
    buttonGroup.appendChild(button);
  });
  
  container.appendChild(buttonGroup);
  return container;
}

/**
 * Update all elements that display period-sensitive values
 */
function updateAllPeriodDisplays() {
  // Update elements with data-weekly-value attribute
  document.querySelectorAll('[data-weekly-value]').forEach(el => {
    const weeklyValue = parseFloat(el.dataset.weeklyValue);
    if (!isNaN(weeklyValue)) {
      const periodValue = convertToPeriod(weeklyValue);
      el.textContent = formatCurrency(periodValue);
    }
  });
  
  // Update period labels
  document.querySelectorAll('[data-period-label]').forEach(el => {
    el.textContent = PERIOD_LABELS[currentPeriod];
  });
  
  // Update period suffixes
  document.querySelectorAll('[data-period-suffix]').forEach(el => {
    el.textContent = getPeriodSuffix();
  });
  
  // Dispatch custom event for components that need custom handling
  document.dispatchEvent(new CustomEvent('periodChange', { detail: { period: currentPeriod } }));
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} Formatted currency
 */
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Initialize period selector from saved preference
 */
export function initializePeriodSelector() {
  try {
    const savedPeriod = localStorage.getItem('ccs-display-period');
    if (savedPeriod && PERIOD_MULTIPLIERS[savedPeriod]) {
      currentPeriod = savedPeriod;
    }
  } catch (e) {
    console.warn('Could not load period preference:', e);
  }
}
