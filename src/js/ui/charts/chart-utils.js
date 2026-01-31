/**
 * Chart Utilities Module
 * Provides shared utility functions for creating charts with vanilla JavaScript and SVG
 */

/**
 * Create a linear scale function (similar to D3 scales)
 * @param {Array<number>} domain - Input domain [min, max]
 * @param {Array<number>} range - Output range [min, max]
 * @returns {Function} Scale function
 */
export function createLinearScale(domain, range) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  
  return (value) => {
    const domainSpan = domainMax - domainMin;
    const rangeSpan = rangeMax - rangeMin;
    
    if (domainSpan === 0) return rangeMin;
    
    const normalized = (value - domainMin) / domainSpan;
    return rangeMin + normalized * rangeSpan;
  };
}

/**
 * Calculate nice tick values for an axis
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} tickCount - Desired number of ticks
 * @returns {Array<number>} Array of tick values
 */
export function calculateNiceTicks(min, max, tickCount = 5) {
  const range = max - min;
  const roughStep = range / (tickCount - 1);
  
  // Find a nice step size (1, 2, 5, 10, 20, 50, etc.)
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;
  
  let step;
  if (residual > 5) {
    step = 10 * magnitude;
  } else if (residual > 2) {
    step = 5 * magnitude;
  } else if (residual > 1) {
    step = 2 * magnitude;
  } else {
    step = magnitude;
  }
  
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  
  const ticks = [];
  for (let i = niceMin; i <= niceMax; i += step) {
    ticks.push(i);
  }
  
  return ticks;
}

/**
 * Format currency for display
 * @param {number} value - Value to format
 * @param {boolean} compact - Use compact notation (K, M)
 * @returns {string} Formatted currency
 */
export function formatCurrency(value, compact = false) {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  }
  
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Create SVG element with attributes
 * @param {string} tagName - SVG element tag name
 * @param {Object} attributes - Attributes to set
 * @returns {SVGElement} Created SVG element
 */
export function createSVGElement(tagName, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  
  return element;
}

/**
 * Create a color palette for charts
 * @param {number} count - Number of colors needed
 * @returns {Array<string>} Array of color hex codes
 */
export function getColorPalette(count) {
  // Accessible color palette with good contrast
  const baseColors = [
    '#2563eb', // Primary blue
    '#10b981', // Success green
    '#f59e0b', // Warning orange
    '#ef4444', // Error red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
  ];
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // Generate additional colors by varying hue
  const colors = [...baseColors];
  const hueStep = 360 / count;
  
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * hueStep) % 360;
    colors.push(`hsl(${hue}, 65%, 55%)`);
  }
  
  return colors;
}

/**
 * Add accessibility attributes to SVG chart
 * @param {SVGElement} svg - SVG element
 * @param {string} title - Chart title
 * @param {string} description - Chart description
 */
export function addChartAccessibility(svg, title, description) {
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', title);
  
  // Add title element
  const titleElement = createSVGElement('title');
  titleElement.textContent = title;
  svg.insertBefore(titleElement, svg.firstChild);
  
  // Add description element
  if (description) {
    const descElement = createSVGElement('desc');
    descElement.textContent = description;
    svg.insertBefore(descElement, titleElement.nextSibling);
  }
}

/**
 * Calculate text dimensions (approximate)
 * @param {string} text - Text to measure
 * @param {number} fontSize - Font size in pixels
 * @returns {Object} Width and height
 */
export function measureText(text, fontSize = 12) {
  // Rough approximation: width ≈ 0.6 * fontSize per character
  const width = text.length * fontSize * 0.6;
  const height = fontSize;
  
  return { width, height };
}

/**
 * Truncate text to fit width
 * @param {string} text - Text to truncate
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} fontSize - Font size
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxWidth, fontSize = 12) {
  const { width } = measureText(text, fontSize);
  
  if (width <= maxWidth) {
    return text;
  }
  
  const charWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / charWidth) - 3; // Reserve space for '...'
  
  return text.slice(0, maxChars) + '...';
}
