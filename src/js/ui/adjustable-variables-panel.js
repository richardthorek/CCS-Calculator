/**
 * Adjustable Variables Panel Module
 * Creates a compact panel for quick access to adjustable parameters:
 * - Parent days per week
 * - Child days per week in care
 */

/**
 * Initialize the adjustable variables panel
 */
export function initializeAdjustableVariablesPanel() {
  const container = document.getElementById('adjustable-variables-container');
  if (!container) {
    console.warn('Adjustable variables container not found');
    return;
  }
  
  // Small delay to ensure form fields are fully initialized with values
  setTimeout(() => {
    // Create the panel structure
    const panel = createAdjustableVariablesPanel();
    container.appendChild(panel);
    
    // Setup event delegation for input changes
    setupPanelEventListeners(container);
    
    // Setup listeners on main form to sync panel with form
    setupFormSyncListeners();
    
    // Setup observer for children addition/removal
    setupChildrenObserver();
    
    console.log('Adjustable variables panel initialized');
  }, 100);
}

/**
 * Create the adjustable variables panel structure
 * @returns {HTMLElement} Panel element
 */
function createAdjustableVariablesPanel() {
  const panel = document.createElement('div');
  panel.className = 'adjustable-variables-panel';
  
  const controls = document.createElement('div');
  controls.className = 'panel-controls';
  controls.id = 'adjustable-variables-controls';
  panel.appendChild(controls);
  
  // Initial population of controls
  updatePanelControls();
  
  return panel;
}

/**
 * Update the panel controls based on current form state
 */
function updatePanelControls() {
  const controlsContainer = document.getElementById('adjustable-variables-controls');
  if (!controlsContainer) return;
  
  // Clear existing controls
  controlsContainer.innerHTML = '';
  
  // Create parent row
  const parentRow = document.createElement('div');
  parentRow.className = 'panel-row panel-parent-row';
  
  // Add parent controls
  const parent1DaysInput = document.getElementById('parent1-days');
  const parent2DaysInput = document.getElementById('parent2-days');
  const parent2IncomeInput = document.getElementById('parent2-income');
  
  if (parent1DaysInput) {
    const parent1Value = parent1DaysInput.value || '0';
    const parent1Control = createCompactInputControl('Parent 1', 'panel-parent1-days', parent1Value);
    parentRow.appendChild(parent1Control);
  }
  
  // Only show Parent 2 if they have entered an income value
  if (parent2IncomeInput && parent2DaysInput) {
    const parent2Income = parseFloat(parent2IncomeInput.value) || 0;
    if (parent2Income > 0) {
      const parent2Value = parent2DaysInput.value || '0';
      const parent2Control = createCompactInputControl('Parent 2', 'panel-parent2-days', parent2Value);
      parentRow.appendChild(parent2Control);
    }
  }
  
  // Add global child setter to parent row
  const childrenContainer = document.getElementById('children-container');
  const childCards = childrenContainer ? childrenContainer.querySelectorAll('.child-card') : [];
  
  if (childCards.length > 0) {
    const globalChildControl = createCompactInputControl('Set All', 'panel-children-all-days', '');
    globalChildControl.classList.add('panel-global-child-control');
    parentRow.appendChild(globalChildControl);
  }
  
  controlsContainer.appendChild(parentRow);
  
  // Create children row if there are children
  if (childCards.length > 0) {
    const childRow = document.createElement('div');
    childRow.className = 'panel-row panel-children-row';
    
    childCards.forEach((card, index) => {
      const childIndex = card.dataset.childIndex;
      const daysInput = document.getElementById(`child-${childIndex}-days-of-care`);
      
      if (daysInput) {
        const childValue = daysInput.value || '0';
        const childControl = createCompactInputControl(
          `Child ${index + 1}`,
          `panel-child-${childIndex}-days`,
          childValue
        );
        childRow.appendChild(childControl);
      }
    });
    
    controlsContainer.appendChild(childRow);
  }
}

/**
 * Create a compact input control for the panel (smaller version)
 * @param {string} label - Label for the control
 * @param {string} id - ID for the input
 * @param {string} initialValue - Initial value
 * @returns {HTMLElement} Control element
 */
function createCompactInputControl(label, id, initialValue) {
  const control = document.createElement('div');
  control.className = 'panel-input-compact';
  
  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', id);
  labelEl.className = 'panel-input-label-compact';
  labelEl.textContent = label;
  control.appendChild(labelEl);
  
  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.className = 'panel-input-field-compact';
  input.min = '0';
  input.max = '5';
  input.step = '1';
  // Ensure we have a value (0 if empty)
  input.value = initialValue || '0';
  input.placeholder = '0';
  
  // Only set data-linked-to for actual field controls, not for the global setter
  if (id !== 'panel-children-all-days') {
    input.dataset.linkedTo = getLinkedFieldId(id);
  }
  
  control.appendChild(input);
  
  return control;
}

/**
 * Get the main form field ID that a panel control is linked to
 * @param {string} panelId - Panel control ID
 * @returns {string} Main form field ID
 */
function getLinkedFieldId(panelId) {
  if (panelId === 'panel-parent1-days') return 'parent1-days';
  if (panelId === 'panel-parent2-days') return 'parent2-days';
  
  // Child control pattern: panel-child-{index}-days -> child-{index}-days-of-care
  const match = panelId.match(/^panel-child-(\d+)-days$/);
  if (match) {
    return `child-${match[1]}-days-of-care`;
  }
  
  return null;
}

/**
 * Get the panel control ID from a main form field ID
 * @param {string} formFieldId - Main form field ID
 * @returns {string} Panel control ID
 */
function getPanelControlId(formFieldId) {
  if (formFieldId === 'parent1-days') return 'panel-parent1-days';
  if (formFieldId === 'parent2-days') return 'panel-parent2-days';
  
  // Child control pattern: child-{index}-days-of-care -> panel-child-{index}-days
  const match = formFieldId.match(/^child-(\d+)-days-of-care$/);
  if (match) {
    return `panel-child-${match[1]}-days`;
  }
  
  return null;
}

/**
 * Setup event listeners for panel inputs
 */
function setupPanelEventListeners(container) {
  container.addEventListener('input', (event) => {
    const input = event.target;
    
    // Handle global child days setter
    if (input.id === 'panel-children-all-days') {
      handleGlobalChildDaysSetter(input.value);
      return;
    }
    
    if (!input.classList.contains('panel-input-field-compact')) return;
    
    const linkedFieldId = input.dataset.linkedTo;
    if (!linkedFieldId) return;
    
    // Update the linked form field
    const linkedField = document.getElementById(linkedFieldId);
    if (linkedField) {
      linkedField.value = input.value;
      
      // Trigger change event on the linked field
      linkedField.dispatchEvent(new Event('input', { bubbles: true }));
      linkedField.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

/**
 * Handle setting all children's days to the same value
 * @param {string} value - Days value to set for all children
 */
function handleGlobalChildDaysSetter(value) {
  const daysOfCareInputs = document.querySelectorAll('.days-of-care-input');
  daysOfCareInputs.forEach(input => {
    input.value = value;
    input.dataset.autoCalculated = 'false';
    
    // Trigger change event
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/**
 * Setup listeners to sync form changes back to the panel
 */
function setupFormSyncListeners() {
  const form = document.getElementById('ccs-calculator-form');
  if (!form) return;
  
  // Create debounced update for structural changes (parent2 visibility)
  const debouncedStructuralUpdate = debounceStructuralUpdate();
  
  form.addEventListener('input', (event) => {
    const target = event.target;
    
    // Check if this is a parent days or child days input
    if (target.id === 'parent1-days' || 
        target.id === 'parent2-days' ||
        target.classList.contains('days-of-care-input')) {
      syncPanelWithForm(target);
    }
    
    // Check if parent2 income changed (affects visibility)
    if (target.id === 'parent2-income') {
      debouncedStructuralUpdate();
    }
  });
  
  form.addEventListener('change', (event) => {
    const target = event.target;
    
    if (target.id === 'parent1-days' || 
        target.id === 'parent2-days' ||
        target.classList.contains('days-of-care-input')) {
      syncPanelWithForm(target);
    }
    
    // Check if parent2 income changed (affects visibility)
    if (target.id === 'parent2-income') {
      debouncedStructuralUpdate();
    }
  });
}

/**
 * Create a debounced function to update panel structure
 */
function debounceStructuralUpdate() {
  let timeoutId = null;
  
  return function() {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      updatePanelControls();
      const container = document.getElementById('adjustable-variables-container');
      if (container) {
        setupPanelEventListeners(container);
      }
    }, 300);
  };
}

/**
 * Sync a panel input with a form field value change
 * @param {HTMLElement} formField - The form field that changed
 */
function syncPanelWithForm(formField) {
  const panelControlId = getPanelControlId(formField.id);
  if (!panelControlId) return;
  
  const panelInput = document.getElementById(panelControlId);
  if (panelInput) {
    // Only update if values differ to avoid re-triggering events
    if (panelInput.value !== formField.value) {
      panelInput.value = formField.value;
    }
  }
}

/**
 * Setup observer for children addition/removal
 * Re-renders the panel when children are added or removed
 */
function setupChildrenObserver() {
  const childrenContainer = document.getElementById('children-container');
  if (!childrenContainer) return;
  
  // Use MutationObserver to watch for child card additions/removals
  const observer = new MutationObserver(() => {
    // Debounce the update to avoid multiple rapid re-renders
    clearTimeout(window.adjustableVariablesPanelUpdateTimeout);
    window.adjustableVariablesPanelUpdateTimeout = setTimeout(() => {
      updatePanelControls();
      setupPanelEventListeners(document.getElementById('adjustable-variables-container'));
    }, 100);
  });
  
  observer.observe(childrenContainer, {
    childList: true,
    subtree: false
  });
}

/**
 * Handle parent visibility changes (Parent 2 added/removed)
 */
export function handleParentVisibilityChange() {
  // Re-render the panel controls
  updatePanelControls();
  
  // Re-setup event listeners
  const container = document.getElementById('adjustable-variables-container');
  if (container) {
    setupPanelEventListeners(container);
  }
}

/**
 * Refresh the panel (useful after major changes)
 */
export function refreshAdjustableVariablesPanel() {
  updatePanelControls();
  const container = document.getElementById('adjustable-variables-container');
  if (container) {
    setupPanelEventListeners(container);
  }
}
