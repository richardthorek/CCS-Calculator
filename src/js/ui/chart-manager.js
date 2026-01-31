/**
 * Chart Manager Module
 * Manages chart display and updates for scenario comparison
 */

import { createScenarioBarChart } from './charts/bar-chart.js';
import { createCostBreakdownChart } from './charts/pie-chart.js';

/**
 * Initialize chart functionality
 */
export function initializeCharts() {
  const toggleBtn = document.getElementById('toggle-chart-btn');
  const chartsContainer = document.getElementById('charts-container');
  
  if (!toggleBtn || !chartsContainer) {
    console.warn('Chart elements not found in DOM');
    return;
  }
  
  // Set up toggle button
  toggleBtn.addEventListener('click', () => {
    const isVisible = chartsContainer.style.display !== 'none';
    
    if (isVisible) {
      chartsContainer.style.display = 'none';
      toggleBtn.textContent = 'Show Charts';
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      chartsContainer.style.display = 'grid';
      toggleBtn.textContent = 'Hide Charts';
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  });
  
  // Set initial ARIA attribute
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-controls', 'charts-container');
}

/**
 * Update charts with scenario data
 * @param {Array<Object>} scenarios - Array of scenario objects
 * @param {Object} selectedScenario - Currently selected/best scenario (optional)
 */
export function updateCharts(scenarios, selectedScenario = null) {
  if (!scenarios || scenarios.length === 0) {
    hideCharts();
    return;
  }
  
  // Show charts section
  showCharts();
  
  // Update bar chart
  updateBarChart(scenarios);
  
  // Update pie chart with selected scenario or best scenario
  const scenarioForPie = selectedScenario || scenarios[0];
  updatePieChart(scenarioForPie);
}

/**
 * Show charts section
 */
function showCharts() {
  const chartsSection = document.getElementById('charts-section');
  if (chartsSection) {
    chartsSection.style.display = 'block';
  }
}

/**
 * Hide charts section
 */
function hideCharts() {
  const chartsSection = document.getElementById('charts-section');
  if (chartsSection) {
    chartsSection.style.display = 'none';
  }
  
  const chartsContainer = document.getElementById('charts-container');
  if (chartsContainer) {
    chartsContainer.style.display = 'none';
  }
  
  const toggleBtn = document.getElementById('toggle-chart-btn');
  if (toggleBtn) {
    toggleBtn.textContent = 'Show Charts';
    toggleBtn.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Update bar chart with scenario comparison
 * @param {Array<Object>} scenarios - Scenario data
 */
function updateBarChart(scenarios) {
  const container = document.getElementById('bar-chart-container');
  
  if (!container) {
    console.warn('Bar chart container not found');
    return;
  }
  
  // Clear existing chart
  container.innerHTML = '';
  
  // Limit scenarios for better visibility (show top 10-15)
  const maxScenarios = window.innerWidth < 768 ? 10 : 15;
  const displayScenarios = scenarios.slice(0, maxScenarios);
  
  // Create bar chart
  const chart = createScenarioBarChart(displayScenarios, 'netIncomeAfterChildcare', {
    width: 800,
    height: 400,
    responsive: true
  });
  
  container.appendChild(chart);
  
  // Add note if scenarios were limited
  if (scenarios.length > maxScenarios) {
    const note = document.createElement('p');
    note.className = 'chart-note';
    note.textContent = `Showing top ${maxScenarios} of ${scenarios.length} scenarios. See table below for all scenarios.`;
    container.appendChild(note);
  }
}

/**
 * Update pie chart with cost breakdown
 * @param {Object} scenario - Scenario object
 */
function updatePieChart(scenario) {
  const container = document.getElementById('pie-chart-container');
  
  if (!container) {
    console.warn('Pie chart container not found');
    return;
  }
  
  // Clear existing chart
  container.innerHTML = '';
  
  // Add scenario title
  const title = document.createElement('h4');
  title.className = 'chart-title';
  title.textContent = `Cost Breakdown: ${scenario.name}`;
  container.appendChild(title);
  
  // Create pie chart
  const chart = createCostBreakdownChart(scenario, {
    width: 400,
    height: 400,
    responsive: true
  });
  
  container.appendChild(chart);
  
  // Add summary text
  const summary = document.createElement('p');
  summary.className = 'chart-summary';
  const totalCost = scenario.annualSubsidy + scenario.annualOutOfPocket;
  const subsidyPercentage = ((scenario.annualSubsidy / totalCost) * 100).toFixed(1);
  summary.textContent = `The government subsidy covers ${subsidyPercentage}% of total childcare costs for this scenario.`;
  container.appendChild(summary);
}

/**
 * Clear all charts
 */
export function clearCharts() {
  const barContainer = document.getElementById('bar-chart-container');
  const pieContainer = document.getElementById('pie-chart-container');
  
  if (barContainer) {
    barContainer.innerHTML = '';
  }
  
  if (pieContainer) {
    pieContainer.innerHTML = '';
  }
  
  hideCharts();
}
