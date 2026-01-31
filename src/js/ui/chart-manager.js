/**
 * Chart Manager Module
 * Manages chart display and updates using Chart.js for compelling visualizations
 */

// Chart.js will be loaded via script tag in HTML
// Access it from global window.Chart

// Store chart instances for cleanup
let barChartInstance = null;
let pieChartInstance = null;

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
  
  // Clear existing content
  container.innerHTML = '';
  
  // Limit scenarios for better visibility
  const maxScenarios = window.innerWidth < 768 ? 10 : 15;
  const displayScenarios = scenarios.slice(0, maxScenarios);
  
  // Create canvas for Chart.js
  const canvas = document.createElement('canvas');
  canvas.id = 'bar-chart';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Bar chart comparing net income across different work scenarios');
  container.appendChild(canvas);
  
  // Prepare data
  const labels = displayScenarios.map(s => s.name);
  const data = displayScenarios.map(s => s.netIncomeAfterChildcare);
  
  // Find best scenario (highest net income)
  const maxValue = Math.max(...data);
  
  // Create gradient colors (highlight best scenario)
  const backgroundColors = data.map(value => 
    value === maxValue ? 'rgba(16, 185, 129, 0.8)' : 'rgba(37, 99, 235, 0.7)'
  );
  const borderColors = data.map(value => 
    value === maxValue ? 'rgb(16, 185, 129)' : 'rgb(37, 99, 235)'
  );
  
  // Destroy existing chart if it exists
  if (barChartInstance) {
    barChartInstance.destroy();
  }
  
  // Create new chart
  barChartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Net Income After Childcare',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Net Income Comparison Across Work Scenarios',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += new Intl.NumberFormat('en-AU', {
                style: 'currency',
                currency: 'AUD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
              return label;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 11
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('en-AU', {
                style: 'currency',
                currency: 'AUD',
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value);
            },
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      }
    }
  });
  
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
  
  // Clear existing content
  container.innerHTML = '';
  
  // Add scenario title
  const title = document.createElement('h4');
  title.className = 'chart-title';
  title.textContent = `Cost Breakdown: ${scenario.name}`;
  container.appendChild(title);
  
  // Create canvas for Chart.js
  const canvas = document.createElement('canvas');
  canvas.id = 'pie-chart';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `Pie chart showing cost breakdown for ${scenario.name} scenario`);
  container.appendChild(canvas);
  
  // Prepare data
  const subsidy = scenario.annualSubsidy || 0;
  const outOfPocket = scenario.annualOutOfPocket || 0;
  const totalCost = subsidy + outOfPocket;
  
  // Destroy existing chart if it exists
  if (pieChartInstance) {
    pieChartInstance.destroy();
  }
  
  // Create new chart
  pieChartInstance = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Government Subsidy', 'Out of Pocket'],
      datasets: [{
        data: [subsidy, outOfPocket],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // Green for subsidy
          'rgba(239, 68, 68, 0.8)'     // Red for out of pocket
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 13,
              weight: '500'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        title: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = totalCost > 0 ? ((value / totalCost) * 100).toFixed(1) : 0;
              const formatted = new Intl.NumberFormat('en-AU', {
                style: 'currency',
                currency: 'AUD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value);
              return `${label}: ${formatted} (${percentage}%)`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      cutout: '60%'
    }
  });
  
  // Add summary text
  const summary = document.createElement('p');
  summary.className = 'chart-summary';
  const subsidyPercentage = totalCost > 0 ? ((subsidy / totalCost) * 100).toFixed(1) : 0;
  summary.textContent = `The government subsidy covers ${subsidyPercentage}% of total childcare costs for this scenario.`;
  container.appendChild(summary);
}

/**
 * Clear all charts
 */
export function clearCharts() {
  if (barChartInstance) {
    barChartInstance.destroy();
    barChartInstance = null;
  }
  
  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }
  
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
