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
  generateCommonScenarios 
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

// Global state for scenarios
let currentScenarios = [];
let currentFormData = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('CCS Calculator initialized');
    
    // Initialize the calculator form
    initializeForm();
    
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
      showScenarioGenerationOption();
      
      // Save scenarios state when form data changes (Phase 6)
      saveCurrentState();
      
      // Store form data in a hidden element for export handler (Phase 7)
      storeFormDataForExport(currentFormData);
    });
    
    // Listen for request to provide form data (Phase 7)
    document.addEventListener('requestFormData', () => {
      storeFormDataForExport(currentFormData);
    });
    
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
      generateAllBtn.addEventListener('click', () => {
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
    comparisonSection.style.display = 'block';
    // Scroll to the section
    comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Generate and display scenarios
 * @param {string} mode - 'all' or 'common'
 */
function generateAndDisplayScenarios(mode = 'common') {
  if (!currentFormData) {
    console.error('No form data available');
    return;
  }
  
  // Prepare base data for scenario generation
  const baseData = {
    parent1BaseIncome: currentFormData.parent1.income,
    parent2BaseIncome: currentFormData.parent2.income || 0,
    parent1HoursPerDay: currentFormData.parent1.hours,
    parent2HoursPerDay: currentFormData.parent2.hours || 0,
    children: currentFormData.children
  };
  
  // Generate scenarios
  let scenarios;
  if (mode === 'all') {
    scenarios = generateAllScenarios(baseData);
  } else {
    scenarios = generateCommonScenarios(baseData);
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
    dataElement.style.display = 'none';
    document.body.appendChild(dataElement);
  }
  
  dataElement.dataset.formData = JSON.stringify(formData);
}

