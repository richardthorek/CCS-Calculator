/**
 * View Toggle Module
 * Handles switching between weekly and annual views
 */

// Current view state ('weekly' or 'annual')
let currentView = 'weekly';

/**
 * Initialize the view toggle
 */
export function initializeViewToggle() {
  const toggle = document.getElementById('annual-toggle');
  if (!toggle) {
    console.warn('Annual toggle not found');
    return;
  }
  
  // Load saved preference from localStorage
  const savedView = localStorage.getItem('ccs-view-preference');
  if (savedView === 'annual') {
    toggle.checked = true;
    currentView = 'annual';
  }
  
  // Listen for toggle changes
  toggle.addEventListener('change', (e) => {
    currentView = e.target.checked ? 'annual' : 'weekly';
    
    // Save preference
    localStorage.setItem('ccs-view-preference', currentView);
    
    // Update all displays
    updateAllDisplays();
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('viewToggleChanged', {
      detail: { view: currentView }
    }));
  });
  
  // Apply initial view if needed
  if (currentView === 'annual') {
    updateAllDisplays();
  }
}

/**
 * Get the current view
 * @returns {string} 'weekly' or 'annual'
 */
export function getCurrentView() {
  return currentView;
}

/**
 * Update all currency displays based on current view
 */
function updateAllDisplays() {
  // Update result cards
  updateResultCards();
  
  // Update comparison table if visible
  updateComparisonTable();
  
  // Update child results
  updateChildResults();
}

/**
 * Update the result cards in the main results section
 */
function updateResultCards() {
  // Weekly Subsidy card
  const weeklySubsidyCard = document.querySelector('.summary-card:has(#result-weekly-subsidy)');
  if (weeklySubsidyCard) {
    const label = weeklySubsidyCard.querySelector('.card-label');
    const sublabel = weeklySubsidyCard.querySelector('.card-sublabel');
    const value = weeklySubsidyCard.querySelector('#result-weekly-subsidy');
    
    if (currentView === 'annual') {
      label.textContent = 'Annual Subsidy';
      sublabel.textContent = 'Government contribution';
      if (value.dataset.weeklyValue) {
        const annualValue = parseFloat(value.dataset.weeklyValue) * 52;
        value.textContent = formatCurrency(annualValue);
      }
    } else {
      label.textContent = 'Weekly Subsidy';
      sublabel.textContent = 'Government contribution';
      if (value.dataset.weeklyValue) {
        value.textContent = formatCurrency(parseFloat(value.dataset.weeklyValue));
      }
    }
  }
  
  // Weekly Out-of-Pocket card
  const weeklyGapCard = document.querySelector('.summary-card:has(#result-weekly-gap)');
  if (weeklyGapCard) {
    const label = weeklyGapCard.querySelector('.card-label');
    const sublabel = weeklyGapCard.querySelector('.card-sublabel');
    const value = weeklyGapCard.querySelector('#result-weekly-gap');
    
    if (currentView === 'annual') {
      label.textContent = 'Annual Out-of-Pocket';
      sublabel.textContent = 'Your cost';
      if (value.dataset.weeklyValue) {
        const annualValue = parseFloat(value.dataset.weeklyValue) * 52;
        value.textContent = formatCurrency(annualValue);
      }
    } else {
      label.textContent = 'Weekly Out-of-Pocket';
      sublabel.textContent = 'Your cost';
      if (value.dataset.weeklyValue) {
        value.textContent = formatCurrency(parseFloat(value.dataset.weeklyValue));
      }
    }
  }
}

/**
 * Update the comparison table values
 */
function updateComparisonTable() {
  const table = document.querySelector('.comparison-table');
  if (!table) return;
  
  // Update header if needed
  const headers = table.querySelectorAll('th');
  headers.forEach(th => {
    if (th.textContent.includes('Weekly') && currentView === 'annual') {
      th.textContent = th.textContent.replace('Weekly', 'Annual');
    } else if (th.textContent.includes('Annual') && currentView === 'weekly') {
      th.textContent = th.textContent.replace('Annual', 'Weekly');
    }
  });
  
  // Update table cells with data-weekly-value attributes
  const cells = table.querySelectorAll('td[data-weekly-value]');
  cells.forEach(cell => {
    const weeklyValue = parseFloat(cell.dataset.weeklyValue);
    if (!isNaN(weeklyValue)) {
      if (currentView === 'annual') {
        cell.textContent = formatCurrency(weeklyValue * 52);
      } else {
        cell.textContent = formatCurrency(weeklyValue);
      }
    }
  });
}

/**
 * Update child results breakdown
 */
function updateChildResults() {
  const childResults = document.querySelectorAll('.child-result-card');
  childResults.forEach(card => {
    // Update subsidy
    const subsidyValue = card.querySelector('[data-weekly-value][data-field="subsidy"]');
    if (subsidyValue) {
      const weeklyValue = parseFloat(subsidyValue.dataset.weeklyValue);
      if (!isNaN(weeklyValue)) {
        const label = card.querySelector('.result-label:has([data-field="subsidy"])');
        if (label) {
          label.textContent = currentView === 'annual' ? 'Annual Subsidy:' : 'Weekly Subsidy:';
        }
        subsidyValue.textContent = currentView === 'annual' 
          ? formatCurrency(weeklyValue * 52) 
          : formatCurrency(weeklyValue);
      }
    }
    
    // Update out-of-pocket
    const outOfPocketValue = card.querySelector('[data-weekly-value][data-field="outOfPocket"]');
    if (outOfPocketValue) {
      const weeklyValue = parseFloat(outOfPocketValue.dataset.weeklyValue);
      if (!isNaN(weeklyValue)) {
        const label = card.querySelector('.result-label:has([data-field="outOfPocket"])');
        if (label) {
          label.textContent = currentView === 'annual' ? 'Annual Out-of-Pocket:' : 'Weekly Out-of-Pocket:';
        }
        outOfPocketValue.textContent = currentView === 'annual' 
          ? formatCurrency(weeklyValue * 52) 
          : formatCurrency(weeklyValue);
      }
    }
    
    // Update total cost
    const costValue = card.querySelector('[data-weekly-value][data-field="cost"]');
    if (costValue) {
      const weeklyValue = parseFloat(costValue.dataset.weeklyValue);
      if (!isNaN(weeklyValue)) {
        const label = card.querySelector('.result-label:has([data-field="cost"])');
        if (label) {
          label.textContent = currentView === 'annual' ? 'Annual Cost:' : 'Weekly Cost:';
        }
        costValue.textContent = currentView === 'annual' 
          ? formatCurrency(weeklyValue * 52) 
          : formatCurrency(weeklyValue);
      }
    }
  });
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
 * Helper to format a value for display based on current view
 * @param {number} weeklyValue - The weekly value
 * @returns {string} Formatted value
 */
export function formatValueForView(weeklyValue) {
  if (currentView === 'annual') {
    return formatCurrency(weeklyValue * 52);
  }
  return formatCurrency(weeklyValue);
}

/**
 * Helper to get the appropriate label for the current view
 * @param {string} weeklyLabel - The label when in weekly view
 * @param {string} annualLabel - The label when in annual view
 * @returns {string} The appropriate label
 */
export function getLabelForView(weeklyLabel, annualLabel) {
  return currentView === 'annual' ? annualLabel : weeklyLabel;
}
