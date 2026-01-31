/**
 * Comparison Table Module
 * Displays and manages scenario comparison table
 */

import {
  generateCommonScenarios,
  generateSingleParentScenarios,
  compareScenarios,
  filterScenarios,
  findBestScenario
} from '../scenarios/generator.js';

import {
  getCurrentPeriod,
  convertToPeriod,
  getPeriodSuffix,
  PERIOD_LABELS,
  onPeriodChange
} from './period-selector.js';

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
 * Format percentage value
 * @param {number} value - Value to format
 * @returns {string} Formatted percentage
 */
function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
}

// Store current scenarios for re-rendering on period change
let currentScenarios = [];
let currentContainerSelector = '#comparison-table-container';
let currentOptions = {};

// Listen for period changes
onPeriodChange((period) => {
  if (currentScenarios.length > 0) {
    displayComparisonTable(currentScenarios, currentContainerSelector, currentOptions);
  }
});

/**
 * Create and display the comparison table
 * @param {Array} scenarios - Array of scenario objects
 * @param {string} containerSelector - CSS selector for container element
 * @param {Object} options - Display options
 */
export function displayComparisonTable(scenarios, containerSelector = '#comparison-table-container', options = {}) {
  // Store for period change re-renders
  currentScenarios = scenarios;
  currentContainerSelector = containerSelector;
  currentOptions = options;
  
  const container = document.querySelector(containerSelector);
  
  if (!container) {
    console.error('Comparison table container not found:', containerSelector);
    return;
  }
  
  // Clear existing content
  container.innerHTML = '';
  
  if (!scenarios || scenarios.length === 0) {
    container.innerHTML = '<p class="no-scenarios">No scenarios to compare. Generate scenarios first.</p>';
    return;
  }
  
  // Use card layout for 4 or fewer scenarios (simplified view), table for more
  let displayElement;
  if (scenarios.length <= 4) {
    displayElement = createComparisonCardsElement(scenarios, options);
  } else {
    displayElement = createComparisonTableElement(scenarios, options);
  }
  
  container.appendChild(displayElement);
  
  // Add event listeners for interactions
  attachTableEventListeners(container, scenarios);
}

/**
 * Create a card-based comparison layout (for simplified scenarios)
 * @param {Array} scenarios - Array of scenarios
 * @param {Object} options - Display options
 * @returns {HTMLElement} Cards container element
 */
function createComparisonCardsElement(scenarios, options = {}) {
  const { highlightBest = true } = options;
  
  // Find best scenario for highlighting
  const bestScenario = highlightBest ? findBestScenario(scenarios, 'netIncomeAfterChildcare') : null;
  
  // Create cards wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'comparison-cards-wrapper';
  
  // Create cards container
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'comparison-cards';
  cardsContainer.setAttribute('role', 'list');
  cardsContainer.setAttribute('aria-label', 'Scenario Comparison Cards');
  
  // Create a card for each scenario
  scenarios.forEach((scenario, index) => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.setAttribute('role', 'listitem');
    
    if (scenario.id === bestScenario?.id) {
      card.classList.add('best-scenario');
    }
    
    // Card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'scenario-card-header';
    
    const title = document.createElement('h3');
    title.className = 'scenario-card-title';
    title.textContent = scenario.name;
    cardHeader.appendChild(title);
    
    if (scenario.id === bestScenario?.id) {
      const badge = document.createElement('span');
      badge.className = 'best-badge';
      badge.textContent = 'Best Option';
      badge.setAttribute('aria-label', 'Best net income');
      cardHeader.appendChild(badge);
    }
    
    const workDays = document.createElement('p');
    workDays.className = 'scenario-work-days';
    workDays.textContent = `${scenario.parent1Days} + ${scenario.parent2Days} work days/week`;
    cardHeader.appendChild(workDays);
    
    card.appendChild(cardHeader);
    
    // Card body with key metrics
    const cardBody = document.createElement('div');
    cardBody.className = 'scenario-card-body';
    
    // Get current period for display
    const period = getCurrentPeriod();
    const periodLabel = PERIOD_LABELS[period];
    const suffix = getPeriodSuffix(period);
    
    // Calculate period values (scenarios store weekly values internally)
    const periodSubsidy = convertToPeriod(scenario.totalWeeklySubsidy || scenario.annualSubsidy / 52, period);
    const periodOutOfPocket = convertToPeriod(scenario.totalWeeklyOutOfPocket || scenario.annualOutOfPocket / 52, period);
    const periodFullCost = convertToPeriod(scenario.totalWeeklyCost || scenario.annualCost / 52, period);
    
    // Create metric items
    const metrics = [
      {
        label: 'Household Income',
        value: formatCurrency(scenario.householdIncome),
        className: 'metric-income',
        isAnnual: true
      },
      {
        label: `Subsidy ${suffix}`,
        value: formatCurrency(periodSubsidy),
        className: 'metric-subsidy',
        highlight: true,
        weeklyValue: scenario.totalWeeklySubsidy || scenario.annualSubsidy / 52
      },
      {
        label: `Out-of-Pocket ${suffix}`,
        value: formatCurrency(periodOutOfPocket),
        className: 'metric-out-of-pocket',
        highlight: true,
        weeklyValue: scenario.totalWeeklyOutOfPocket || scenario.annualOutOfPocket / 52
      },
      {
        label: 'Net Income (Annual)',
        value: formatCurrency(scenario.netIncomeAfterChildcare),
        className: 'metric-net-income',
        highlight: true,
        primary: scenario.id === bestScenario?.id,
        isAnnual: true
      }
    ];
    
    metrics.forEach(metric => {
      const metricItem = document.createElement('div');
      metricItem.className = `scenario-metric ${metric.className}`;
      if (metric.highlight) {
        metricItem.classList.add('metric-highlight');
      }
      if (metric.primary) {
        metricItem.classList.add('metric-primary');
      }
      
      const label = document.createElement('div');
      label.className = 'metric-label';
      label.textContent = metric.label;
      
      const value = document.createElement('div');
      value.className = 'metric-value';
      value.textContent = metric.value;
      
      metricItem.appendChild(label);
      metricItem.appendChild(value);
      cardBody.appendChild(metricItem);
    });
    
    card.appendChild(cardBody);
    
    // Card actions (optional - can be hidden for simplified view)
    const cardActions = document.createElement('div');
    cardActions.className = 'scenario-card-actions';
    cardActions.style.display = 'none'; // Hide for simplified view
    
    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `favorite-btn ${scenario.isFavorite ? 'active' : ''}`;
    favoriteBtn.setAttribute('aria-label', scenario.isFavorite ? 'Remove from favorites' : 'Add to favorites');
    favoriteBtn.setAttribute('data-scenario-id', scenario.id);
    favoriteBtn.innerHTML = scenario.isFavorite ? '★ Favorited' : '☆ Favorite';
    cardActions.appendChild(favoriteBtn);
    
    card.appendChild(cardActions);
    
    cardsContainer.appendChild(card);
  });
  
  wrapper.appendChild(cardsContainer);
  
  return wrapper;
}

/**
 * Create the comparison table DOM element
 * @param {Array} scenarios - Array of scenarios
 * @param {Object} options - Display options
 * @returns {HTMLElement} Table element
 */
function createComparisonTableElement(scenarios, options = {}) {
  const {
    showWorkDays = true,
    showIncome = true,
    showSubsidy = true,
    showOutOfPocket = true,
    showNetIncome = true,
    showCostPercentage = true,
    highlightBest = true
  } = options;
  
  // Find best scenario for highlighting
  const bestScenario = highlightBest ? findBestScenario(scenarios, 'netIncomeAfterChildcare') : null;
  
  // Create table wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'comparison-table-wrapper';
  
  // Create table
  const table = document.createElement('table');
  table.className = 'comparison-table';
  table.setAttribute('role', 'table');
  table.setAttribute('aria-label', 'Scenario Comparison Table');
  
  // Create thead
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Metric column header
  const metricHeader = document.createElement('th');
  metricHeader.textContent = 'Metric';
  metricHeader.setAttribute('scope', 'col');
  headerRow.appendChild(metricHeader);
  
  // Scenario column headers
  scenarios.forEach((scenario, index) => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'col');
    th.className = scenario.id === bestScenario?.id ? 'best-scenario' : '';
    
    const scenarioHeader = document.createElement('div');
    scenarioHeader.className = 'scenario-header';
    
    const name = document.createElement('div');
    name.className = 'scenario-name';
    name.textContent = scenario.name;
    
    const actions = document.createElement('div');
    actions.className = 'scenario-actions';
    
    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `favorite-btn ${scenario.isFavorite ? 'active' : ''}`;
    favoriteBtn.setAttribute('aria-label', scenario.isFavorite ? 'Remove from favorites' : 'Add to favorites');
    favoriteBtn.setAttribute('data-scenario-id', scenario.id);
    favoriteBtn.innerHTML = scenario.isFavorite ? '★' : '☆';
    actions.appendChild(favoriteBtn);
    
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.setAttribute('aria-label', 'Remove scenario');
    removeBtn.setAttribute('data-scenario-id', scenario.id);
    removeBtn.innerHTML = '×';
    actions.appendChild(removeBtn);
    
    scenarioHeader.appendChild(name);
    scenarioHeader.appendChild(actions);
    
    if (scenario.id === bestScenario?.id) {
      const badge = document.createElement('span');
      badge.className = 'best-badge';
      badge.textContent = 'Best';
      badge.setAttribute('aria-label', 'Best net income');
      scenarioHeader.appendChild(badge);
    }
    
    th.appendChild(scenarioHeader);
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody
  const tbody = document.createElement('tbody');
  
  // Work days row
  if (showWorkDays) {
    const row = createTableRow('Work Days', scenarios, (s) => 
      `${s.parent1Days} + ${s.parent2Days} days`
    );
    tbody.appendChild(row);
  }
  
  // Household income row
  if (showIncome) {
    const row = createTableRow('Adjusted Household Income', scenarios, (s) => 
      formatCurrency(s.householdIncome)
    );
    tbody.appendChild(row);
  }
  
  // Annual subsidy row
  if (showSubsidy) {
    const row = createTableRow('Annual Subsidy', scenarios, (s) => 
      formatCurrency(s.annualSubsidy)
    );
    tbody.appendChild(row);
  }
  
  // Out of pocket row
  if (showOutOfPocket) {
    const row = createTableRow('Annual Out-of-Pocket', scenarios, (s) => 
      formatCurrency(s.annualOutOfPocket)
    );
    tbody.appendChild(row);
  }
  
  // Net income row
  if (showNetIncome) {
    const row = createTableRow('Net Income After Childcare', scenarios, (s) => 
      formatCurrency(s.netIncomeAfterChildcare),
      true  // highlight
    );
    tbody.appendChild(row);
  }
  
  // Cost percentage row
  if (showCostPercentage) {
    const row = createTableRow('Childcare Cost %', scenarios, (s) => 
      formatPercentage(s.childcareCostPercentage)
    );
    tbody.appendChild(row);
  }
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  
  return wrapper;
}

/**
 * Create a table row
 * @param {string} label - Row label
 * @param {Array} scenarios - Scenarios
 * @param {Function} valueExtractor - Function to extract value from scenario
 * @param {boolean} highlight - Whether to highlight best value
 * @returns {HTMLElement} Table row
 */
function createTableRow(label, scenarios, valueExtractor, highlight = false) {
  const row = document.createElement('tr');
  
  // Label cell
  const labelCell = document.createElement('th');
  labelCell.setAttribute('scope', 'row');
  labelCell.textContent = label;
  row.appendChild(labelCell);
  
  // Find best value for highlighting
  let bestValue = null;
  if (highlight) {
    const values = scenarios.map(s => {
      const value = valueExtractor(s);
      // Extract numeric value from formatted string if needed
      if (typeof value === 'string') {
        return parseFloat(value.replace(/[^0-9.-]/g, ''));
      }
      return value;
    });
    bestValue = Math.max(...values);
  }
  
  // Value cells
  scenarios.forEach(scenario => {
    const cell = document.createElement('td');
    const value = valueExtractor(scenario);
    cell.textContent = value;
    
    if (highlight) {
      const numericValue = typeof value === 'string' ? 
        parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
      if (numericValue === bestValue) {
        cell.classList.add('highlight');
      }
    }
    
    row.appendChild(cell);
  });
  
  return row;
}

/**
 * Attach event listeners to table elements
 * @param {HTMLElement} container - Table container
 * @param {Array} scenarios - Scenarios
 */
function attachTableEventListeners(container, scenarios) {
  // Favorite button clicks
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite-btn')) {
      const scenarioId = e.target.getAttribute('data-scenario-id');
      toggleFavorite(scenarioId, scenarios);
      e.target.classList.toggle('active');
      e.target.innerHTML = e.target.classList.contains('active') ? '★' : '☆';
      e.target.setAttribute('aria-label', 
        e.target.classList.contains('active') ? 'Remove from favorites' : 'Add to favorites'
      );
    }
    
    // Remove button clicks
    if (e.target.classList.contains('remove-btn')) {
      const scenarioId = e.target.getAttribute('data-scenario-id');
      removeScenario(scenarioId, scenarios, container);
    }
  });
}

/**
 * Toggle favorite status of a scenario
 * @param {string} scenarioId - Scenario ID
 * @param {Array} scenarios - Scenarios array
 */
function toggleFavorite(scenarioId, scenarios) {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (scenario) {
    scenario.isFavorite = !scenario.isFavorite;
    
    // Dispatch custom event for other components to react
    document.dispatchEvent(new CustomEvent('scenarioFavoriteToggled', {
      detail: { scenarioId, isFavorite: scenario.isFavorite }
    }));
  }
}

/**
 * Remove a scenario from the comparison
 * @param {string} scenarioId - Scenario ID
 * @param {Array} scenarios - Scenarios array
 * @param {HTMLElement} container - Table container
 */
function removeScenario(scenarioId, scenarios, container) {
  const index = scenarios.findIndex(s => s.id === scenarioId);
  if (index > -1) {
    scenarios.splice(index, 1);
    
    // Redisplay table
    displayComparisonTable(scenarios, `#${container.id}`);
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('scenarioRemoved', {
      detail: { scenarioId }
    }));
  }
}

/**
 * Export scenarios to CSV
 * @param {Array} scenarios - Scenarios to export
 * @param {string} filename - Output filename
 */
export function exportToCSV(scenarios, filename = 'ccs-scenarios.csv') {
  if (!scenarios || scenarios.length === 0) {
    console.warn('No scenarios to export');
    return;
  }
  
  // Create CSV header
  const headers = [
    'Scenario',
    'Work Days (P1+P2)',
    'Parent 1 Income',
    'Parent 2 Income',
    'Household Income',
    'Annual Subsidy',
    'Annual Cost',
    'Annual Out-of-Pocket',
    'Net Income After Childcare',
    'Childcare Cost %'
  ];
  
  // Create CSV rows
  const rows = scenarios.map(scenario => [
    scenario.name,
    `${scenario.parent1Days}+${scenario.parent2Days}`,
    scenario.parent1Income,
    scenario.parent2Income,
    scenario.householdIncome,
    scenario.annualSubsidy,
    scenario.annualCost,
    scenario.annualOutOfPocket,
    scenario.netIncomeAfterChildcare,
    scenario.childcareCostPercentage.toFixed(2)
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sort scenarios by a metric
 * @param {Array} scenarios - Scenarios to sort
 * @param {string} metric - Metric to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted scenarios
 */
export function sortScenarios(scenarios, metric, order = 'desc') {
  return [...scenarios].sort((a, b) => compareScenarios(a, b, metric, order));
}

/**
 * Initialize comparison table controls
 * @param {Object} options - Initialization options
 */
export function initializeComparisonControls(options = {}) {
  const {
    sortSelector = '#scenario-sort',
    exportSelector = '#export-csv-btn',
    filterSelector = '#scenario-filter'
  } = options;
  
  // Sort control
  const sortControl = document.querySelector(sortSelector);
  if (sortControl) {
    sortControl.addEventListener('change', (e) => {
      document.dispatchEvent(new CustomEvent('scenarioSortChanged', {
        detail: { metric: e.target.value }
      }));
    });
  }
  
  // Export button
  const exportBtn = document.querySelector(exportSelector);
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('exportScenariosRequested'));
    });
  }
  
  // Filter control
  const filterControl = document.querySelector(filterSelector);
  if (filterControl) {
    filterControl.addEventListener('change', (e) => {
      document.dispatchEvent(new CustomEvent('scenarioFilterChanged', {
        detail: { filter: e.target.value }
      }));
    });
  }
}
