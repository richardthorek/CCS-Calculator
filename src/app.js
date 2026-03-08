// CCS Calculator - Main Application JavaScript

import { initializeForm } from './js/ui/form-handler.js';
import { 
  displayComparisonTable, 
  exportToCSV, 
  sortScenarios,
  initializeComparisonControls 
} from './js/ui/comparison-table.js';
import { 
  generateAllScenarios, 
  generateCommonScenarios,
  generateSimplifiedScenarios 
} from './js/scenarios/generator.js';
import { loadState, saveState, clearState } from './js/storage/persistence.js';
import { 
  initializeCharts, 
  updateCharts, 
  clearCharts 
} from './js/ui/chart-manager.js';
import {
  initializeExportHandlers,
  loadFromURL
} from './js/ui/export-handler.js';
import{
  initializeViewToggle
} from './js/ui/view-toggle.js';
import {
  initializePresets
} from './js/ui/presets.js';
import {
  initializeTooltips
} from './js/ui/tooltips.js';
import {
  createPeriodSelector,
  initializePeriodSelector,
  getCurrentPeriod,
  convertToPeriod,
  getPeriodSuffix,
  onPeriodChange
} from './js/ui/period-selector.js';
import {
  initFormattedIncomeInputs
} from './js/utils/format-input.js';
import {
  initializeAllCollapses
} from './js/ui/collapsible-sections.js';
import {
  initializeTheme,
  initializeThemeToggle
} from './js/ui/theme-toggle.js';
import {
  initializeAdjustableVariablesPanel
} from './js/ui/adjustable-variables-panel.js';
import { authManager } from './js/auth/auth-manager.js';
import { storageManager } from './js/storage/storage-manager.js';

// Global state for scenarios
let currentScenarios = [];
let currentFormData = null;

// Initialize theme before DOM content loads to prevent flash
initializeTheme();

document.addEventListener('DOMContentLoaded', function() {
    console.log('CCS Calculator initialized');
    
    // Initialize period selector first
    initializePeriodSelector();
    
    // Create and insert the period selector
    const periodContainer = document.getElementById('global-period-selector');
    if (periodContainer) {
      const periodSelector = createPeriodSelector({ showLabel: true });
      periodContainer.appendChild(periodSelector);
    }
    
    // Listen for period changes to update displays
    onPeriodChange((period) => {
      updateResultsDisplayForPeriod();
    });
    
    // Initialize the calculator form
    initializeForm();
    
    // Initialize adjustable variables panel
    initializeAdjustableVariablesPanel();
    
    // Initialize formatted income inputs (with thousand separators)
    initFormattedIncomeInputs();
    
    // Initialize comparison controls
    initializeComparisonControls();
    
    // Setup clear data button (Phase 6)
    setupClearDataButton();
    
    // Try to restore saved scenarios (Phase 6)
    restoreSavedScenarios();
    
    // Initialize charts (Phase 7)
    initializeCharts();
    
    // Initialize export handlers (Phase 7)
    initializeExportHandlers();
    
    // Initialize view toggle (Phase 7)
    initializeViewToggle();
    
    // Initialize scenario presets (Phase 7)
    initializePresets();
    
    // Initialize help tooltips (Phase 7)
    initializeTooltips();
    
    // Initialize collapsible sections for mobile/tablet
    initializeAllCollapses();
    
    // Initialize authentication (Phase 8.3)
    initializeAuth();
    
    // Check if URL contains shared data and load it (Phase 7)
    const urlData = loadFromURL();
    if (urlData) {
      console.log('Loading data from URL:', urlData);
      // Dispatch event to populate form with URL data
      document.dispatchEvent(new CustomEvent('loadFormDataFromURL', { detail: urlData }));
    }
    
    // Listen for form calculation success to enable scenario generation
    document.addEventListener('calculationComplete', (event) => {
      currentFormData = event.detail.formData;
      
      // Auto-generate simplified scenarios when form changes
      autoGenerateScenarios();
      
      // Show the detailed results section
      showDetailedResults();
      
      // Save scenarios state when form data changes (Phase 6)
      saveCurrentState();
      
      // Store form data in a hidden element for export handler (Phase 7)
      storeFormDataForExport(currentFormData);
    });
    
    // Listen for request to provide form data (Phase 7)
    document.addEventListener('requestFormData', () => {
      storeFormDataForExport(currentFormData);
    });
    
    // Generate simplified scenarios button (NEW - default)
    const generateSimplifiedBtn = document.getElementById('generate-simplified-scenarios-btn');
    if (generateSimplifiedBtn) {
      generateSimplifiedBtn.addEventListener('click', () => {
        if (currentFormData) {
          generateAndDisplayScenarios('simplified');
        }
      });
    }
    
    // Generate all scenarios button
    const generateAllBtn = document.getElementById('generate-all-scenarios-btn');
    if (generateAllBtn) {
      generateAllBtn.addEventListener('click', () => {
        if (currentFormData) {
          generateAndDisplayScenarios('all');
        }
      });
    }
    
    // Generate common scenarios button
    const generateCommonBtn = document.getElementById('generate-common-scenarios-btn');
    if (generateCommonBtn) {
      generateCommonBtn.addEventListener('click', () => {
        if (currentFormData) {
          generateAndDisplayScenarios('common');
        }
      });
    }
    
    // Export to CSV
    document.addEventListener('exportScenariosRequested', () => {
      if (currentScenarios.length > 0) {
        exportToCSV(currentScenarios);
      }
    });
    
    // Sort scenarios
    document.addEventListener('scenarioSortChanged', (event) => {
      const metric = event.detail.metric;
      if (currentScenarios.length > 0) {
        const sortedScenarios = sortScenarios(currentScenarios, metric);
        displayComparisonTable(sortedScenarios);
      }
    });
    
    // Handle scenario removal
    document.addEventListener('scenarioRemoved', (event) => {
      const scenarioId = event.detail.scenarioId;
      currentScenarios = currentScenarios.filter(s => s.id !== scenarioId);
      saveCurrentState(); // Phase 6
    });
});

/**
 * Show the scenario generation section
 */
function showScenarioGenerationOption() {
  const comparisonSection = document.getElementById('comparison-section');
  if (comparisonSection) {
    comparisonSection.classList.remove('hidden');
  }
}

/**
 * Show detailed results section
 */
function showDetailedResults() {
  const detailedSection = document.getElementById('detailed-results-section');
  if (detailedSection) {
    detailedSection.classList.remove('hidden');
  }
  
  const chartsSection = document.getElementById('charts-section');
  if (chartsSection) {
    chartsSection.classList.remove('hidden');
  }
}

/**
 * Auto-generate simplified scenarios when form data changes
 */
function autoGenerateScenarios() {
  if (!currentFormData) return;
  
  // Generate simplified scenarios automatically
  generateAndDisplayScenarios('simplified');
}

/**
 * Update results display for the current period
 */
function updateResultsDisplayForPeriod() {
  const period = getCurrentPeriod();
  const suffix = getPeriodSuffix(period);
  
  // Update all period suffix labels
  document.querySelectorAll('[data-period-suffix]').forEach(el => {
    el.textContent = suffix;
  });
  
  // Update all period-aware values
  document.querySelectorAll('[data-weekly-value]').forEach(el => {
    const weeklyValue = parseFloat(el.dataset.weeklyValue);
    if (!isNaN(weeklyValue)) {
      const periodValue = convertToPeriod(weeklyValue, period);
      el.textContent = formatCurrencySimple(periodValue);
    }
  });
}

/**
 * Simple currency formatter
 */
function formatCurrencySimple(value) {
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
 * Generate and display scenarios
 * @param {string} mode - 'all', 'common', or 'simplified'
 */
function generateAndDisplayScenarios(mode = 'simplified') {
  if (!currentFormData) {
    console.error('No form data available');
    return;
  }
  
  // Transform children data to the format expected by scenario generator
  const transformedChildren = currentFormData.children.map(child => {
    // If using daily rate, convert to hourly
    if (child.feeType === 'daily') {
      const hourlyRate = child.hoursPerDay > 0 ? child.dailyFee / child.hoursPerDay : 0;
      const hoursPerWeek = child.daysOfCare * child.hoursPerDay;
      
      return {
        age: child.age,
        careType: child.careType,
        providerFee: hourlyRate,
        hoursPerWeek: hoursPerWeek
      };
    } else {
      // Already in hourly format
      return {
        age: child.age,
        careType: child.careType,
        providerFee: child.providerFee,
        hoursPerWeek: child.hoursPerWeek
      };
    }
  });
  
  // Prepare base data for scenario generation
  const baseData = {
    parent1BaseIncome: currentFormData.parent1.income,
    parent2BaseIncome: currentFormData.parent2.income || 0,
    parent1Days: currentFormData.parent1.days,
    parent2Days: currentFormData.parent2.days || 0,
    parent1HoursPerDay: currentFormData.parent1.hours,
    parent2HoursPerDay: currentFormData.parent2.hours || 0,
    children: transformedChildren
  };
  
  // Generate scenarios
  let scenarios;
  if (mode === 'all') {
    scenarios = generateAllScenarios(baseData);
  } else if (mode === 'common') {
    scenarios = generateCommonScenarios(baseData);
  } else {
    // Default to simplified scenarios
    scenarios = generateSimplifiedScenarios(baseData);
  }
  
  // Store scenarios
  currentScenarios = scenarios;
  
  // Display comparison table
  displayComparisonTable(scenarios);
  
  // Update charts (Phase 7)
  updateCharts(scenarios);
  
  // Show count
  const container = document.getElementById('comparison-table-container');
  if (container && scenarios.length > 0) {
    const countMsg = document.createElement('p');
    countMsg.className = 'scenario-count';
    countMsg.textContent = `Showing ${scenarios.length} scenario${scenarios.length > 1 ? 's' : ''}`;
    container.insertBefore(countMsg, container.firstChild);
  }
  
  // Save state after generating scenarios (Phase 6)
  saveCurrentState();
}

/**
 * Save current application state (Phase 6)
 */
function saveCurrentState() {
  try {
    const state = loadState() || {};
    state.scenarios = currentScenarios;
    state.timestamp = new Date().toISOString();
    saveState(state);
  } catch (error) {
    console.error('Error saving application state:', error);
  }
}

/**
 * Restore saved scenarios (Phase 6)
 */
function restoreSavedScenarios() {
  try {
    const savedState = loadState();
    if (savedState && savedState.scenarios && Array.isArray(savedState.scenarios) && savedState.scenarios.length > 0) {
      currentScenarios = savedState.scenarios;
      displayComparisonTable(currentScenarios);
      updateCharts(currentScenarios); // Phase 7
      showScenarioGenerationOption();
      console.log('Scenarios restored from localStorage');
    }
  } catch (error) {
    console.error('Error restoring scenarios:', error);
  }
}

/**
 * Setup clear data button functionality (Phase 6)
 */
function setupClearDataButton() {
  const clearDataBtn = document.getElementById('clear-data-btn');
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      // Show confirmation dialog
      if (confirm('Are you sure you want to clear all saved data? This will reset the calculator and cannot be undone.')) {
        // Clear localStorage
        clearState();
        
        // Reload the page to reset the form
        window.location.reload();
      }
    });
  }
}

/**
 * Store form data in a hidden element for export handler (Phase 7)
 * @param {Object} formData - Form data to store
 */
function storeFormDataForExport(formData) {
  if (!formData) return;
  
  let dataElement = document.getElementById('current-form-data');
  if (!dataElement) {
    dataElement = document.createElement('div');
    dataElement.id = 'current-form-data';
    dataElement.className = 'hidden';
    document.body.appendChild(dataElement);
  }
  
  dataElement.dataset.formData = JSON.stringify(formData);
}

// ===== Phase 8.3 – Authentication =====

/**
 * Initialize authentication: check current auth state and wire up UI handlers.
 */
async function initializeAuth() {
  // Initialize the auth menu dropdown interaction
  initializeAuthMenu();

  // Initialize the theme toggle (now lives inside the dropdown panel)
  initializeThemeToggle();

  const user = await authManager.checkAuth();
  updateAuthUI(user);
  wireAuthHandlers();
}

/**
 * Set up the consolidated auth + theme dropdown menu:
 * - Toggle `is-open` on trigger click (for keyboard / touch support)
 * - Close the menu when the user clicks outside it
 * - Close the menu on Escape key press
 */
function initializeAuthMenu() {
  const menu = document.getElementById('auth-menu');
  const trigger = document.getElementById('auth-menu-trigger');
  if (!menu || !trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close when clicking outside the menu
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });
}

/**
 * Update auth UI elements to reflect the current authentication state.
 * @param {Object|null} user - Authenticated user object, or null if not logged in
 */
function updateAuthUI(user) {
  const panelSignin = document.getElementById('auth-panel-signin');
  const panelUser = document.getElementById('auth-panel-user');
  const userEmailEl = document.getElementById('user-email');
  const triggerIcon = document.querySelector('#auth-menu-trigger .auth-menu-icon');
  const triggerLabel = document.querySelector('#auth-menu-trigger .auth-menu-label');

  if (!panelSignin || !panelUser) return;

  if (user) {
    // Show user section, hide sign-in section
    panelUser.hidden = false;
    panelSignin.hidden = true;
    const displayName = user.email || user.id || 'Account';
    if (userEmailEl) userEmailEl.textContent = displayName;
    // Update trigger to show user profile
    if (triggerIcon) triggerIcon.textContent = '👤';
    if (triggerLabel) triggerLabel.textContent = displayName;
  } else {
    // Show sign-in section, hide user section
    panelSignin.hidden = false;
    panelUser.hidden = true;
    // Update trigger to show sign-in prompt
    if (triggerIcon) triggerIcon.textContent = '💾';
    if (triggerLabel) triggerLabel.textContent = 'Sign in';
  }
}

/**
 * Update the current scenario name displayed in the auth panel.
 * @param {string} name - The scenario name to display
 */
function updateScenarioNameDisplay(name) {
  const el = document.getElementById('current-scenario-name');
  if (el) el.textContent = name || 'My Scenario';
}

/**
 * Show an inline feedback message in the auth panel.
 * Auto-hides after 3 seconds.
 * @param {string} message - The message to show
 * @param {boolean} [isError=false] - Whether to style as an error
 */
function showAuthPanelFeedback(message, isError = false) {
  const el = document.getElementById('auth-panel-feedback');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.className = `auth-panel-feedback${isError ? ' auth-panel-feedback--error' : ''}`;
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => { el.hidden = true; }, 3000);
}

/**
 * Wire up click handlers for login provider buttons and the logout button.
 */
function wireAuthHandlers() {
  // Login buttons (one per provider via data-provider attribute)
  document.querySelectorAll('.btn-auth[data-provider]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      authManager.login(provider);
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to sign out?')) {
        authManager.logout();
      }
    });
  }

  // ── New Scenario flow ─────────────────────────────────────────────────────

  const newScenarioBtn = document.getElementById('btn-new-scenario');
  const newScenarioForm = document.getElementById('new-scenario-form');
  const newScenarioInput = document.getElementById('new-scenario-input');
  const newScenarioConfirm = document.getElementById('btn-new-scenario-confirm');
  const newScenarioCancel = document.getElementById('btn-new-scenario-cancel');

  if (newScenarioBtn && newScenarioForm && newScenarioInput) {
    // Show the inline form
    newScenarioBtn.addEventListener('click', () => {
      newScenarioForm.hidden = false;
      newScenarioBtn.hidden = true;
      newScenarioInput.value = '';
      newScenarioInput.focus();
    });

    // Cancel – hide form, restore button
    const cancelNewScenario = () => {
      newScenarioForm.hidden = true;
      newScenarioBtn.hidden = false;
    };

    newScenarioCancel?.addEventListener('click', cancelNewScenario);

    // Confirm – create scenario
    const confirmNewScenario = async () => {
      const name = newScenarioInput.value.trim();
      if (!name) {
        newScenarioInput.focus();
        return;
      }
      newScenarioConfirm.disabled = true;
      try {
        const scenario = await storageManager.createNewScenario(name);
        if (scenario) {
          storageManager.activeScenarioId = scenario.id;
          storageManager.activeScenarioName = scenario.name;
          updateScenarioNameDisplay(scenario.name);
          cancelNewScenario();
          // Clear localStorage so the new scenario starts fresh
          clearState();
          window.location.reload();
        } else {
          showAuthPanelFeedback('Could not create scenario. Please try again.', true);
        }
      } finally {
        newScenarioConfirm.disabled = false;
      }
    };

    newScenarioConfirm?.addEventListener('click', confirmNewScenario);
    newScenarioInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmNewScenario();
      if (e.key === 'Escape') cancelNewScenario();
    });
  }

  // ── Rename Scenario flow ──────────────────────────────────────────────────

  const renameBtn = document.getElementById('btn-rename-scenario');
  const renameForm = document.getElementById('scenario-rename-form');
  const renameInput = document.getElementById('scenario-rename-input');
  const renameConfirmBtn = document.getElementById('btn-rename-confirm');
  const renameCancelBtn = document.getElementById('btn-rename-cancel');
  const scenarioNameView = document.getElementById('scenario-name-view');

  if (renameBtn && renameForm && renameInput) {
    // Show the inline rename input
    renameBtn.addEventListener('click', () => {
      const currentName = storageManager.activeScenarioName || 'My Scenario';
      renameInput.value = currentName;
      scenarioNameView?.setAttribute('hidden', '');
      renameForm.hidden = false;
      renameInput.focus();
      renameInput.select();
    });

    const cancelRename = () => {
      renameForm.hidden = true;
      scenarioNameView?.removeAttribute('hidden');
    };

    renameCancelBtn?.addEventListener('click', cancelRename);

    const confirmRename = async () => {
      const newName = renameInput.value.trim();
      if (!newName) {
        renameInput.focus();
        return;
      }
      if (!storageManager.activeScenarioId) {
        showAuthPanelFeedback('No active scenario to rename.', true);
        cancelRename();
        return;
      }
      renameConfirmBtn.disabled = true;
      try {
        const ok = await storageManager.renameScenario(storageManager.activeScenarioId, newName);
        if (ok) {
          storageManager.activeScenarioName = newName;
          updateScenarioNameDisplay(newName);
          cancelRename();
        } else {
          showAuthPanelFeedback('Could not rename. Please try again.', true);
        }
      } finally {
        renameConfirmBtn.disabled = false;
      }
    };

    renameConfirmBtn?.addEventListener('click', confirmRename);
    renameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmRename();
      if (e.key === 'Escape') cancelRename();
    });
  }

  // Listen for scenarioChanged events to update the name display
  document.addEventListener('scenarioChanged', (event) => {
    if (event.detail && event.detail.name) {
      updateScenarioNameDisplay(event.detail.name);
    }
  });
}

