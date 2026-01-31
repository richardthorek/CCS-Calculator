/**
 * Tooltip Module
 * Provides accessible help tooltips using vanilla JavaScript
 */

// Tooltip content mapping
const TOOLTIP_CONTENT = {
  'adjusted-income': 'Your adjusted income is calculated based on your annual income and work days per week. This reflects your actual earnings: 1 day = 20%, 2 days = 40%, 3 days = 60%, 4 days = 80%, 5 days = 100% of your full-time income.',
  
  'work-days': 'Select the days you typically work each week. Your adjusted income is based on days worked (not hours per day).',
  
  'hours-per-day': 'Enter your typical work hours per day. This is used to calculate childcare hours needed and activity test requirements, but does not affect your adjusted income calculation.',
  
  'child-age': 'The child\'s age affects the CCS subsidy rate. Children under 5 may qualify for higher subsidy rates for younger siblings.',
  
  'care-type': 'Different care types have different hourly rate caps set by the government. Centre-based care is the most common type.',
  
  'hourly-fee': 'Enter what your childcare provider charges per hour. If they charge more than the government cap, you\'ll pay the difference.',
  
  'sessions-per-week': 'How many days per week does your child attend childcare? This is typically the same as your work days.',
  
  'ccs-percentage': 'The CCS percentage is the portion of approved fees the government will pay. It\'s based on your household income and family circumstances.',
  
  'subsidised-hours': 'The government will subsidise a maximum number of hours per fortnight based on your activity level (work, study, or approved activities).',
  
  'activity-test': 'To qualify for CCS, parents must meet the activity test through work, study, training, volunteering, or searching for work. The more hours of activity, the more subsidised childcare hours you receive.'
};

/**
 * Initialize tooltips
 */
export function initializeTooltips() {
  // Add tooltip triggers to appropriate elements
  addTooltipTriggers();
  
  // Set up event listeners for showing/hiding tooltips
  setupTooltipListeners();
}

/**
 * Add tooltip triggers to form elements
 */
function addTooltipTriggers() {
  // Parent income fields
  addTooltipToField('parent1-income', 'adjusted-income');
  addTooltipToField('parent2-income', 'adjusted-income');
  
  // Work days
  addTooltipToSection('parent1-workdays-group', 'work-days');
  addTooltipToSection('parent2-workdays-group', 'work-days');
  
  // Hours per day
  addTooltipToField('parent1-hours', 'hours-per-day');
  addTooltipToField('parent2-hours', 'hours-per-day');
  
  // Add tooltips to result labels
  addTooltipToResult('Subsidised Hours per Week:', 'subsidised-hours');
}

/**
 * Add tooltip icon to a form field label
 * @param {string} fieldId - ID of the form field
 * @param {string} tooltipKey - Key for tooltip content
 */
function addTooltipToField(fieldId, tooltipKey) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  const label = document.querySelector(`label[for="${fieldId}"]`);
  if (!label) return;
  
  const tooltipIcon = createTooltipIcon(tooltipKey);
  label.appendChild(tooltipIcon);
}

/**
 * Add tooltip icon to a section
 * @param {string} sectionId - ID of the section
 * @param {string} tooltipKey - Key for tooltip content
 */
function addTooltipToSection(sectionId, tooltipKey) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  // Find the label or heading in the section
  const label = section.querySelector('.form-label, label');
  if (!label) return;
  
  const tooltipIcon = createTooltipIcon(tooltipKey);
  label.appendChild(tooltipIcon);
}

/**
 * Add tooltip to a result label
 * @param {string} labelText - Text of the label
 * @param {string} tooltipKey - Key for tooltip content
 */
function addTooltipToResult(labelText, tooltipKey) {
  // Find all info-label spans
  const labels = document.querySelectorAll('.info-label');
  labels.forEach(label => {
    if (label.textContent.includes(labelText)) {
      const tooltipIcon = createTooltipIcon(tooltipKey);
      label.appendChild(tooltipIcon);
    }
  });
}

/**
 * Create a tooltip icon element
 * @param {string} tooltipKey - Key for tooltip content
 * @returns {HTMLElement} Tooltip icon element
 */
function createTooltipIcon(tooltipKey) {
  const icon = document.createElement('span');
  icon.className = 'tooltip-icon';
  icon.innerHTML = '&#9432;'; // Info icon (ⓘ)
  icon.setAttribute('role', 'button');
  icon.setAttribute('tabindex', '0');
  icon.setAttribute('aria-label', 'Show help');
  icon.dataset.tooltipKey = tooltipKey;
  
  return icon;
}

/**
 * Set up event listeners for tooltips
 */
function setupTooltipListeners() {
  // Use event delegation for efficiency
  document.addEventListener('click', handleTooltipClick);
  document.addEventListener('keydown', handleTooltipKeydown);
  
  // Close tooltip when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tooltip-icon') && !e.target.closest('.tooltip-popup')) {
      closeAllTooltips();
    }
  });
}

/**
 * Handle tooltip click events
 * @param {Event} e - Click event
 */
function handleTooltipClick(e) {
  const icon = e.target.closest('.tooltip-icon');
  if (!icon) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const tooltipKey = icon.dataset.tooltipKey;
  toggleTooltip(icon, tooltipKey);
}

/**
 * Handle tooltip keyboard events
 * @param {Event} e - Keyboard event
 */
function handleTooltipKeydown(e) {
  const icon = e.target.closest('.tooltip-icon');
  if (!icon) return;
  
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const tooltipKey = icon.dataset.tooltipKey;
    toggleTooltip(icon, tooltipKey);
  } else if (e.key === 'Escape') {
    closeAllTooltips();
  }
}

/**
 * Toggle tooltip visibility
 * @param {HTMLElement} icon - Tooltip icon element
 * @param {string} tooltipKey - Key for tooltip content
 */
function toggleTooltip(icon, tooltipKey) {
  // Check if tooltip already exists
  const existingTooltip = icon.querySelector('.tooltip-popup');
  
  if (existingTooltip) {
    closeTooltip(icon);
  } else {
    // Close any other open tooltips first
    closeAllTooltips();
    showTooltip(icon, tooltipKey);
  }
}

/**
 * Show a tooltip
 * @param {HTMLElement} icon - Tooltip icon element
 * @param {string} tooltipKey - Key for tooltip content
 */
function showTooltip(icon, tooltipKey) {
  const content = TOOLTIP_CONTENT[tooltipKey];
  if (!content) {
    console.warn('Tooltip content not found for key:', tooltipKey);
    return;
  }
  
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip-popup';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.innerHTML = `
    <div class="tooltip-content">${content}</div>
    <button class="tooltip-close" aria-label="Close tooltip">&times;</button>
  `;
  
  icon.appendChild(tooltip);
  icon.classList.add('tooltip-active');
  
  // Position tooltip
  positionTooltip(icon, tooltip);
  
  // Add close button listener
  const closeBtn = tooltip.querySelector('.tooltip-close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTooltip(icon);
  });
}

/**
 * Position tooltip relative to icon
 * @param {HTMLElement} icon - Tooltip icon
 * @param {HTMLElement} tooltip - Tooltip popup
 */
function positionTooltip(icon, tooltip) {
  const iconRect = icon.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  
  // Default: position below and to the right
  tooltip.style.top = '100%';
  tooltip.style.left = '0';
  tooltip.style.marginTop = '0.5rem';
  
  // Check if tooltip would go off screen
  setTimeout(() => {
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // If off right edge, position to the left
    if (tooltipRect.right > viewportWidth - 20) {
      tooltip.style.left = 'auto';
      tooltip.style.right = '0';
    }
    
    // If near bottom of screen, position above
    if (tooltipRect.bottom > window.innerHeight - 20) {
      tooltip.style.top = 'auto';
      tooltip.style.bottom = '100%';
      tooltip.style.marginTop = '0';
      tooltip.style.marginBottom = '0.5rem';
    }
  }, 0);
}

/**
 * Close a specific tooltip
 * @param {HTMLElement} icon - Tooltip icon element
 */
function closeTooltip(icon) {
  const tooltip = icon.querySelector('.tooltip-popup');
  if (tooltip) {
    tooltip.remove();
  }
  icon.classList.remove('tooltip-active');
}

/**
 * Close all open tooltips
 */
function closeAllTooltips() {
  const activeIcons = document.querySelectorAll('.tooltip-icon.tooltip-active');
  activeIcons.forEach(icon => closeTooltip(icon));
}

/**
 * Add tooltip content
 * @param {string} key - Tooltip key
 * @param {string} content - Tooltip content
 */
export function addTooltipContent(key, content) {
  TOOLTIP_CONTENT[key] = content;
}
