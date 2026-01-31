/**
 * Pie Chart Module
 * Creates responsive pie/donut charts using vanilla SVG for cost breakdown
 */

import {
  createSVGElement,
  getColorPalette,
  addChartAccessibility,
  formatCurrency
} from './chart-utils.js';

/**
 * Create a pie chart
 * @param {Array<Object>} data - Array of data segments {label, value, color}
 * @param {Object} options - Chart configuration options
 * @returns {SVGElement} SVG element containing the chart
 */
export function createPieChart(data, options = {}) {
  const {
    width = 400,
    height = 400,
    innerRadius = 0, // 0 for pie chart, >0 for donut chart
    title = 'Pie Chart',
    showLabels = true,
    showLegend = true,
    showPercentages = true,
    valueFormatter = formatCurrency,
    responsive = true
  } = options;
  
  // Create SVG container
  const svg = createSVGElement('svg', {
    width: responsive ? '100%' : width,
    height: responsive ? '100%' : height,
    viewBox: `0 0 ${width} ${height}`,
    class: 'pie-chart'
  });
  
  // Add accessibility
  const description = `Pie chart showing ${data.length} segments`;
  addChartAccessibility(svg, title, description);
  
  // Calculate total
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  if (total === 0) {
    // No data to display
    const text = createSVGElement('text', {
      x: width / 2,
      y: height / 2,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: '#64748b',
      'font-size': '16'
    });
    text.textContent = 'No data available';
    svg.appendChild(text);
    return svg;
  }
  
  // Calculate center and radius
  const legendHeight = showLegend ? 100 : 0;
  const centerX = width / 2;
  const centerY = (height - legendHeight) / 2;
  const radius = Math.min(centerX, centerY) - 40;
  const effectiveInnerRadius = innerRadius * radius;
  
  // Assign colors if not provided
  const colors = getColorPalette(data.length);
  const dataWithColors = data.map((d, i) => ({
    ...d,
    color: d.color || colors[i]
  }));
  
  // Create chart group
  const chartGroup = createSVGElement('g', {
    transform: `translate(${centerX}, ${centerY})`
  });
  svg.appendChild(chartGroup);
  
  // Draw slices
  let currentAngle = -Math.PI / 2; // Start at top
  
  dataWithColors.forEach((d, i) => {
    const percentage = (d.value / total) * 100;
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = currentAngle + angle;
    
    // Draw slice
    const slice = drawSlice(
      chartGroup,
      currentAngle,
      endAngle,
      radius,
      effectiveInnerRadius,
      d.color,
      d.label,
      d.value,
      percentage,
      valueFormatter
    );
    
    // Draw label if enabled and slice is large enough
    if (showLabels && percentage > 5) {
      drawSliceLabel(
        chartGroup,
        currentAngle,
        angle,
        radius,
        d.label,
        showPercentages ? `${percentage.toFixed(1)}%` : ''
      );
    }
    
    currentAngle = endAngle;
  });
  
  // Draw legend if enabled
  if (showLegend) {
    drawLegend(svg, dataWithColors, total, width, height - legendHeight + 20, valueFormatter);
  }
  
  return svg;
}

/**
 * Draw a pie slice
 */
function drawSlice(group, startAngle, endAngle, radius, innerRadius, color, label, value, percentage, valueFormatter) {
  const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;
  
  // Calculate outer arc points
  const x1 = Math.cos(startAngle) * radius;
  const y1 = Math.sin(startAngle) * radius;
  const x2 = Math.cos(endAngle) * radius;
  const y2 = Math.sin(endAngle) * radius;
  
  let pathData;
  
  if (innerRadius > 0) {
    // Donut chart
    const x3 = Math.cos(endAngle) * innerRadius;
    const y3 = Math.sin(endAngle) * innerRadius;
    const x4 = Math.cos(startAngle) * innerRadius;
    const y4 = Math.sin(startAngle) * innerRadius;
    
    pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
  } else {
    // Pie chart
    pathData = [
      'M 0 0',
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
  }
  
  const path = createSVGElement('path', {
    d: pathData,
    fill: color,
    stroke: '#ffffff',
    'stroke-width': '2',
    class: 'pie-slice',
    tabindex: '0',
    role: 'graphics-symbol',
    'aria-label': `${label}: ${valueFormatter(value)} (${percentage.toFixed(1)}%)`
  });
  
  // Add tooltip
  const tooltip = createSVGElement('title');
  tooltip.textContent = `${label}\n${valueFormatter(value)}\n${percentage.toFixed(1)}%`;
  path.appendChild(tooltip);
  
  // Add interactivity
  path.style.cursor = 'pointer';
  path.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  
  let originalTransform = '';
  
  path.addEventListener('mouseenter', function() {
    // Slightly enlarge the slice
    const midAngle = (startAngle + endAngle) / 2;
    const offsetX = Math.cos(midAngle) * 5;
    const offsetY = Math.sin(midAngle) * 5;
    this.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    this.style.opacity = '0.9';
  });
  
  path.addEventListener('mouseleave', function() {
    this.style.transform = originalTransform;
    this.style.opacity = '1';
  });
  
  path.addEventListener('focus', function() {
    const midAngle = (startAngle + endAngle) / 2;
    const offsetX = Math.cos(midAngle) * 5;
    const offsetY = Math.sin(midAngle) * 5;
    this.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    this.style.opacity = '0.9';
  });
  
  path.addEventListener('blur', function() {
    this.style.transform = originalTransform;
    this.style.opacity = '1';
  });
  
  group.appendChild(path);
  return path;
}

/**
 * Draw label for a slice
 */
function drawSliceLabel(group, startAngle, angle, radius, label, percentageText) {
  const midAngle = startAngle + angle / 2;
  const labelRadius = radius * 0.7;
  const x = Math.cos(midAngle) * labelRadius;
  const y = Math.sin(midAngle) * labelRadius;
  
  const text = createSVGElement('text', {
    x: x,
    y: y,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    fill: '#ffffff',
    'font-size': '12',
    'font-weight': '600',
    'pointer-events': 'none',
    class: 'slice-label'
  });
  
  // Add percentage on first line
  if (percentageText) {
    const tspan = createSVGElement('tspan', {
      x: x,
      dy: '-0.3em'
    });
    tspan.textContent = percentageText;
    text.appendChild(tspan);
  }
  
  group.appendChild(text);
}

/**
 * Draw legend
 */
function drawLegend(svg, data, total, width, yOffset, valueFormatter) {
  const legendGroup = createSVGElement('g', {
    class: 'legend',
    transform: `translate(0, ${yOffset})`
  });
  
  const itemWidth = Math.min(width / data.length, 200);
  const startX = (width - itemWidth * data.length) / 2;
  
  data.forEach((d, i) => {
    const x = startX + i * itemWidth;
    const percentage = ((d.value / total) * 100).toFixed(1);
    
    // Color box
    const rect = createSVGElement('rect', {
      x: x,
      y: 0,
      width: 16,
      height: 16,
      fill: d.color,
      rx: 2
    });
    legendGroup.appendChild(rect);
    
    // Label
    const labelText = createSVGElement('text', {
      x: x + 22,
      y: 8,
      'dominant-baseline': 'middle',
      fill: '#1e293b',
      'font-size': '12',
      class: 'legend-label'
    });
    labelText.textContent = d.label;
    legendGroup.appendChild(labelText);
    
    // Value
    const valueText = createSVGElement('text', {
      x: x + 22,
      y: 24,
      'dominant-baseline': 'middle',
      fill: '#64748b',
      'font-size': '11',
      class: 'legend-value'
    });
    valueText.textContent = `${valueFormatter(d.value)} (${percentage}%)`;
    legendGroup.appendChild(valueText);
  });
  
  svg.appendChild(legendGroup);
}

/**
 * Create a pie chart showing cost breakdown for a scenario
 * @param {Object} scenario - Scenario object with cost data
 * @param {Object} options - Chart options
 * @returns {SVGElement} Pie chart SVG
 */
export function createCostBreakdownChart(scenario, options = {}) {
  const data = [
    {
      label: 'CCS Subsidy',
      value: scenario.annualSubsidy || 0,
      color: '#10b981' // Green
    },
    {
      label: 'Out of Pocket',
      value: scenario.annualOutOfPocket || 0,
      color: '#ef4444' // Red
    }
  ];
  
  return createPieChart(data, {
    ...options,
    title: 'Annual Childcare Cost Breakdown',
    innerRadius: 0.5, // Donut chart
    showLabels: true,
    showLegend: true,
    showPercentages: true
  });
}

/**
 * Create a pie chart showing subsidy percentage distribution
 * @param {Array<Object>} children - Array of child objects with CCS rates
 * @param {Object} options - Chart options
 * @returns {SVGElement} Pie chart SVG
 */
export function createSubsidyDistributionChart(children, options = {}) {
  const data = children.map((child, i) => ({
    label: `Child ${i + 1} (${child.ccsRate}%)`,
    value: child.weeklySubsidy || 0
  }));
  
  return createPieChart(data, {
    ...options,
    title: 'Weekly Subsidy Distribution by Child',
    showLabels: true,
    showLegend: true,
    showPercentages: true
  });
}
