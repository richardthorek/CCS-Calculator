/**
 * Bar Chart Module
 * Creates responsive bar charts using vanilla SVG for scenario comparison
 */

import {
  createLinearScale,
  calculateNiceTicks,
  formatCurrency,
  createSVGElement,
  getColorPalette,
  addChartAccessibility,
  truncateText
} from './chart-utils.js';

/**
 * Create a bar chart comparing scenarios
 * @param {Array<Object>} data - Array of data points with label and value
 * @param {Object} options - Chart configuration options
 * @returns {SVGElement} SVG element containing the chart
 */
export function createBarChart(data, options = {}) {
  const {
    width = 800,
    height = 400,
    marginTop = 40,
    marginRight = 20,
    marginBottom = 80,
    marginLeft = 80,
    barColor = '#2563eb',
    highlightColor = '#10b981',
    highlightIndex = null,
    title = 'Comparison Chart',
    xAxisLabel = '',
    yAxisLabel = '',
    valueFormatter = formatCurrency,
    responsive = true
  } = options;
  
  // Calculate chart dimensions
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;
  
  // Create SVG container
  const svg = createSVGElement('svg', {
    width: responsive ? '100%' : width,
    height: responsive ? '100%' : height,
    viewBox: `0 0 ${width} ${height}`,
    class: 'bar-chart'
  });
  
  // Add accessibility
  const description = `Bar chart showing ${data.length} data points`;
  addChartAccessibility(svg, title, description);
  
  // Find data range
  const values = data.map(d => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values);
  
  // Calculate nice ticks for Y axis
  const yTicks = calculateNiceTicks(minValue, maxValue, 5);
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];
  
  // Create scales
  const xScale = createLinearScale([0, data.length], [0, chartWidth]);
  const yScale = createLinearScale([yMax, yMin], [0, chartHeight]);
  
  // Create chart group
  const chartGroup = createSVGElement('g', {
    transform: `translate(${marginLeft}, ${marginTop})`
  });
  svg.appendChild(chartGroup);
  
  // Draw Y axis
  drawYAxis(chartGroup, yTicks, yScale, chartHeight, valueFormatter);
  
  // Draw X axis
  drawXAxis(chartGroup, data, xScale, chartHeight);
  
  // Draw bars
  drawBars(chartGroup, data, xScale, yScale, chartHeight, barColor, highlightColor, highlightIndex, valueFormatter);
  
  // Draw axis labels
  if (yAxisLabel) {
    drawYAxisLabel(svg, yAxisLabel, marginLeft, height);
  }
  
  if (xAxisLabel) {
    drawXAxisLabel(svg, xAxisLabel, width, height, marginBottom);
  }
  
  return svg;
}

/**
 * Draw Y axis with ticks and grid lines
 */
function drawYAxis(group, ticks, yScale, chartHeight, valueFormatter) {
  const axisGroup = createSVGElement('g', { class: 'y-axis' });
  
  ticks.forEach(tick => {
    const y = yScale(tick);
    
    // Grid line
    const gridLine = createSVGElement('line', {
      x1: 0,
      y1: y,
      x2: '100%',
      y2: y,
      class: 'grid-line',
      stroke: '#e2e8f0',
      'stroke-width': '1',
      'stroke-dasharray': '4 4'
    });
    axisGroup.appendChild(gridLine);
    
    // Tick label
    const label = createSVGElement('text', {
      x: -10,
      y: y,
      'text-anchor': 'end',
      'dominant-baseline': 'middle',
      class: 'axis-label',
      fill: '#64748b',
      'font-size': '12'
    });
    label.textContent = valueFormatter(tick, true);
    axisGroup.appendChild(label);
  });
  
  // Y axis line
  const axisLine = createSVGElement('line', {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: chartHeight,
    stroke: '#64748b',
    'stroke-width': '2'
  });
  axisGroup.appendChild(axisLine);
  
  group.appendChild(axisGroup);
}

/**
 * Draw X axis with labels
 */
function drawXAxis(group, data, xScale, chartHeight) {
  const axisGroup = createSVGElement('g', { class: 'x-axis' });
  
  const barWidth = xScale(1) - xScale(0);
  const barPadding = barWidth * 0.2;
  const actualBarWidth = barWidth - barPadding;
  
  data.forEach((d, i) => {
    const x = xScale(i) + barPadding / 2 + actualBarWidth / 2;
    
    // Tick label
    const label = createSVGElement('text', {
      x: x,
      y: chartHeight + 20,
      'text-anchor': 'middle',
      class: 'axis-label',
      fill: '#64748b',
      'font-size': '11',
      transform: `rotate(-45, ${x}, ${chartHeight + 20})`
    });
    
    // Truncate long labels
    const truncated = truncateText(d.label, 80, 11);
    label.textContent = truncated;
    
    // Add title for full text on hover
    if (truncated !== d.label) {
      const title = createSVGElement('title');
      title.textContent = d.label;
      label.appendChild(title);
    }
    
    axisGroup.appendChild(label);
  });
  
  // X axis line
  const axisLine = createSVGElement('line', {
    x1: 0,
    y1: chartHeight,
    x2: '100%',
    y2: chartHeight,
    stroke: '#64748b',
    'stroke-width': '2'
  });
  axisGroup.appendChild(axisLine);
  
  group.appendChild(axisGroup);
}

/**
 * Draw bars with tooltips
 */
function drawBars(group, data, xScale, yScale, chartHeight, barColor, highlightColor, highlightIndex, valueFormatter) {
  const barsGroup = createSVGElement('g', { class: 'bars' });
  
  const barWidth = xScale(1) - xScale(0);
  const barPadding = barWidth * 0.2;
  const actualBarWidth = barWidth - barPadding;
  
  data.forEach((d, i) => {
    const x = xScale(i) + barPadding / 2;
    const y = yScale(d.value);
    const barHeight = chartHeight - y;
    const isHighlighted = highlightIndex === i;
    const color = isHighlighted ? highlightColor : barColor;
    
    // Bar rect
    const rect = createSVGElement('rect', {
      x: x,
      y: y,
      width: actualBarWidth,
      height: Math.max(barHeight, 0),
      fill: color,
      class: isHighlighted ? 'bar bar-highlighted' : 'bar',
      'data-value': d.value,
      'data-label': d.label,
      tabindex: '0',
      role: 'graphics-symbol',
      'aria-label': `${d.label}: ${valueFormatter(d.value)}`
    });
    
    // Add hover effect
    rect.style.cursor = 'pointer';
    rect.style.transition = 'fill 0.2s ease';
    
    // Tooltip
    const tooltip = createSVGElement('title');
    tooltip.textContent = `${d.label}\n${valueFormatter(d.value)}`;
    rect.appendChild(tooltip);
    
    // Add interactivity
    rect.addEventListener('mouseenter', function() {
      this.style.fill = highlightColor;
      this.style.opacity = '0.8';
    });
    
    rect.addEventListener('mouseleave', function() {
      this.style.fill = color;
      this.style.opacity = '1';
    });
    
    rect.addEventListener('focus', function() {
      this.style.fill = highlightColor;
      this.style.opacity = '0.8';
    });
    
    rect.addEventListener('blur', function() {
      this.style.fill = color;
      this.style.opacity = '1';
    });
    
    barsGroup.appendChild(rect);
  });
  
  group.appendChild(barsGroup);
}

/**
 * Draw Y axis label
 */
function drawYAxisLabel(svg, label, marginLeft, height) {
  const text = createSVGElement('text', {
    x: -(height / 2),
    y: marginLeft - 50,
    'text-anchor': 'middle',
    class: 'axis-title',
    fill: '#1e293b',
    'font-size': '14',
    'font-weight': '600',
    transform: 'rotate(-90)'
  });
  text.textContent = label;
  svg.appendChild(text);
}

/**
 * Draw X axis label
 */
function drawXAxisLabel(svg, label, width, height, marginBottom) {
  const text = createSVGElement('text', {
    x: width / 2,
    y: height - marginBottom + 65,
    'text-anchor': 'middle',
    class: 'axis-title',
    fill: '#1e293b',
    'font-size': '14',
    'font-weight': '600'
  });
  text.textContent = label;
  svg.appendChild(text);
}

/**
 * Create a bar chart from scenario data
 * @param {Array<Object>} scenarios - Scenario objects from comparison table
 * @param {string} metric - Metric to chart (e.g., 'netIncomeAfterChildcare')
 * @param {Object} options - Chart options
 * @returns {SVGElement} Bar chart SVG
 */
export function createScenarioBarChart(scenarios, metric = 'netIncomeAfterChildcare', options = {}) {
  // Sort scenarios by the metric
  const sortedScenarios = [...scenarios].sort((a, b) => b[metric] - a[metric]);
  
  // Find best scenario for highlighting
  const bestIndex = 0; // Already sorted by best first
  
  // Prepare data
  const data = sortedScenarios.map(scenario => ({
    label: scenario.name,
    value: scenario[metric]
  }));
  
  // Determine chart title and labels
  const titles = {
    netIncomeAfterChildcare: 'Net Income After Childcare',
    householdIncome: 'Total Household Income',
    annualOutOfPocket: 'Annual Out-of-Pocket Cost',
    annualSubsidy: 'Annual CCS Subsidy'
  };
  
  const title = titles[metric] || 'Scenario Comparison';
  
  return createBarChart(data, {
    ...options,
    title: title,
    yAxisLabel: 'Amount (AUD)',
    xAxisLabel: 'Work Scenario (Days per Week)',
    highlightIndex: bestIndex
  });
}
