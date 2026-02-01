/**
 * Collapsible Sections Module
 * Handles collapse/expand functionality for parent and child sections
 * Automatically collapses on mobile/tablet after data entry
 * Keeps expanded by default on desktop
 */

/**
 * Check if the current viewport is mobile or tablet
 * @returns {boolean} True if mobile or tablet (max-width: 1023px)
 */
function isMobileOrTablet() {
  return window.matchMedia('(max-width: 1023px)').matches;
}

/**
 * Create a collapse/expand button
 * @param {string} sectionId - ID of the section to control
 * @param {string} labelCollapsed - Label when section is collapsed (e.g., "Edit")
 * @param {string} labelExpanded - Label when section is expanded (e.g., "Collapse")
 * @returns {HTMLElement} The button element
 */
function createCollapseButton(sectionId, labelCollapsed = 'Edit', labelExpanded = 'Collapse') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'collapse-toggle-btn';
  button.setAttribute('aria-controls', sectionId);
  button.setAttribute('aria-expanded', 'true');
  button.setAttribute('aria-label', 'Collapse section');
  button.dataset.labelCollapsed = labelCollapsed;
  button.dataset.labelExpanded = labelExpanded;
  // Chevron SVG icon that rotates
  button.innerHTML = `<svg class="collapse-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  
  return button;
}

/**
 * Create a compact summary element for a section
 * @param {string} summaryHtml - HTML content for the summary
 * @returns {HTMLElement} The summary element
 */
function createSummaryElement(summaryHtml) {
  const summary = document.createElement('div');
  summary.className = 'section-summary hidden';
  summary.setAttribute('aria-live', 'polite');
  summary.innerHTML = summaryHtml;
  
  return summary;
}

/**
 * Toggle a section between collapsed and expanded states
 * @param {HTMLElement} section - The section element
 * @param {HTMLElement} button - The toggle button
 * @param {HTMLElement} content - The content to collapse/expand
 * @param {HTMLElement} summary - The summary to show when collapsed
 */
function toggleSection(section, button, content, summary) {
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  const newState = !isExpanded;
  
  // Update button
  button.setAttribute('aria-expanded', newState.toString());
  button.setAttribute('aria-label', newState ? 'Collapse section' : 'Expand section');
  
  if (newState) {
    // Expanding
    content.classList.remove('hidden');
    summary.classList.add('hidden');
    section.classList.remove('collapsed');
  } else {
    // Collapsing
    content.classList.add('hidden');
    summary.classList.remove('hidden');
    section.classList.add('collapsed');
  }
  
  // Announce to screen readers
  const announcement = newState ? 'Section expanded' : 'Section collapsed';
  announceToScreenReader(announcement);
}

/**
 * Announce text to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  const announcer = document.getElementById('sr-announcer') || createScreenReaderAnnouncer();
  announcer.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

/**
 * Create a screen reader announcer element
 * @returns {HTMLElement} The announcer element
 */
function createScreenReaderAnnouncer() {
  const announcer = document.createElement('div');
  announcer.id = 'sr-announcer';
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  document.body.appendChild(announcer);
  
  return announcer;
}

/**
 * Parse numeric value from input, removing commas
 * @param {HTMLInputElement} input - Input element
 * @returns {number} Parsed numeric value or 0
 */
function parseNumericValue(input) {
  if (!input || !input.value) return 0;
  return parseFloat(input.value.replace(/,/g, '')) || 0;
}

/**
 * Check if all required fields in a parent section are filled and valid
 * @param {number} parentNumber - Parent number (1 or 2)
 * @returns {boolean} True if all required fields are valid
 */
function isParentSectionComplete(parentNumber) {
  const incomeInput = document.getElementById(`parent${parentNumber}-income`);
  const daysInput = document.getElementById(`parent${parentNumber}-days`);
  const hoursInput = document.getElementById(`parent${parentNumber}-hours`);
  
  // Check that all required inputs exist
  if (!incomeInput || !daysInput || !hoursInput) return false;
  
  // Parse values
  const income = parseNumericValue(incomeInput);
  const days = parseFloat(daysInput.value) || 0;
  const hours = parseFloat(hoursInput.value) || 0;
  
  // All fields must be filled with valid values
  // Income must be > 0, days can be 0-5, hours must be > 0
  return income > 0 && days >= 0 && days <= 5 && hours > 0;
}

/**
 * Check if all required fields in a child card are filled and valid
 * @param {number} childIndex - Child index
 * @returns {boolean} True if all required fields are valid
 */
function isChildCardComplete(childIndex) {
  const ageInput = document.getElementById(`child-${childIndex}-age`);
  const careTypeSelect = document.getElementById(`child-${childIndex}-care-type`);
  const feeTypeRadios = document.querySelectorAll(`input[name="child-${childIndex}-fee-type"]`);
  const daysOfCareInput = document.getElementById(`child-${childIndex}-days-of-care`);
  
  // Check that all required inputs exist
  if (!ageInput || !careTypeSelect || !daysOfCareInput) return false;
  
  // Parse basic values
  const age = parseInt(ageInput.value) || 0;
  const careType = careTypeSelect.value;
  const daysOfCare = parseFloat(daysOfCareInput.value) || 0;
  
  // Age must be > 0, care type must be selected, days must be 0-5
  if (age <= 0 || !careType || daysOfCare < 0 || daysOfCare > 5) {
    return false;
  }
  
  // Determine which fee type is selected
  let feeType = 'daily';
  feeTypeRadios.forEach(radio => {
    if (radio.checked) {
      feeType = radio.value;
    }
  });
  
  // Check fee-specific fields based on fee type
  if (feeType === 'daily') {
    const dailyFeeInput = document.getElementById(`child-${childIndex}-daily-fee`);
    const hoursPerDayInput = document.getElementById(`child-${childIndex}-hours-per-day`);
    
    if (!dailyFeeInput || !hoursPerDayInput) return false;
    
    const dailyFee = parseNumericValue(dailyFeeInput);
    const hoursPerDay = parseFloat(hoursPerDayInput.value) || 0;
    
    // Daily fee must be > 0, hours per day must be > 0
    return dailyFee > 0 && hoursPerDay > 0;
  } else {
    // Hourly fee type
    const hourlyFeeInput = document.getElementById(`child-${childIndex}-hourly-fee`);
    const hoursPerWeekInput = document.getElementById(`child-${childIndex}-hours-per-week`);
    
    if (!hourlyFeeInput || !hoursPerWeekInput) return false;
    
    const hourlyFee = parseNumericValue(hourlyFeeInput);
    const hoursPerWeek = parseFloat(hoursPerWeekInput.value) || 0;
    
    // Hourly fee must be > 0, hours per week must be > 0
    return hourlyFee > 0 && hoursPerWeek > 0;
  }
}

/**
 * Get summary data for a parent section
 * @param {number} parentNumber - Parent number (1 or 2)
 * @returns {string} Summary HTML
 */
function getParentSummary(parentNumber) {
  const incomeInput = document.getElementById(`parent${parentNumber}-income`);
  const daysInput = document.getElementById(`parent${parentNumber}-days`);
  const hoursInput = document.getElementById(`parent${parentNumber}-hours`);
  
  const income = parseNumericValue(incomeInput);
  const days = daysInput ? parseFloat(daysInput.value) || 0 : 0;
  const hours = hoursInput ? parseFloat(hoursInput.value) || 0 : 0;
  
  if (income === 0 && days === 0 && hours === 0) {
    return '<span class="summary-empty">No data entered</span>';
  }
  
  const formattedIncome = income > 0 
    ? new Intl.NumberFormat('en-AU', { 
        style: 'currency', 
        currency: 'AUD', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      }).format(income)
    : '—';
  
  return `
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-label">Income:</span>
        <span class="summary-value">${formattedIncome}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Schedule:</span>
        <span class="summary-value">${days} days × ${hours}h</span>
      </div>
    </div>
  `;
}

/**
 * Get summary data for a child card
 * @param {number} childIndex - Child index
 * @returns {string} Summary HTML
 */
function getChildSummary(childIndex) {
  const ageInput = document.getElementById(`child-${childIndex}-age`);
  const careTypeSelect = document.getElementById(`child-${childIndex}-care-type`);
  const feeTypeRadios = document.querySelectorAll(`input[name="child-${childIndex}-fee-type"]`);
  const dailyFeeInput = document.getElementById(`child-${childIndex}-daily-fee`);
  const daysOfCareInput = document.getElementById(`child-${childIndex}-days-of-care`);
  
  const age = ageInput ? parseInt(ageInput.value) || 0 : 0;
  const careType = careTypeSelect ? careTypeSelect.options[careTypeSelect.selectedIndex].text : '';
  
  let feeType = 'daily';
  feeTypeRadios.forEach(radio => {
    if (radio.checked) {
      feeType = radio.value;
    }
  });
  
  const dailyFee = parseNumericValue(dailyFeeInput);
  const daysOfCare = daysOfCareInput ? parseFloat(daysOfCareInput.value) || 0 : 0;
  
  if (age === 0 && dailyFee === 0) {
    return '<span class="summary-empty">No data entered</span>';
  }
  
  const formattedFee = dailyFee > 0 
    ? new Intl.NumberFormat('en-AU', { 
        style: 'currency', 
        currency: 'AUD', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      }).format(dailyFee)
    : '—';
  
  return `
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-label">Age:</span>
        <span class="summary-value">${age > 0 ? age + 'y' : '—'}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Type:</span>
        <span class="summary-value summary-value-truncate">${careType || '—'}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Fee:</span>
        <span class="summary-value">${formattedFee}/day</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Days:</span>
        <span class="summary-value">${daysOfCare > 0 ? daysOfCare : '—'}</span>
      </div>
    </div>
  `;
}

/**
 * Initialize collapsible functionality for a parent section
 * @param {number} parentNumber - Parent number (1 or 2)
 */
export function initializeParentCollapse(parentNumber) {
  const section = document.getElementById(`parent${parentNumber}-section`);
  if (!section) return;
  
  // Skip if already initialized
  if (section.dataset.collapseInitialized === 'true') return;
  section.dataset.collapseInitialized = 'true';
  
  const sectionId = `parent${parentNumber}-content`;
  
  // Find or create content wrapper
  let content = section.querySelector('.section-content');
  if (!content) {
    content = document.createElement('div');
    content.className = 'section-content';
    content.id = sectionId;
    
    // Move all section children (except title) into content wrapper
    const title = section.querySelector('.section-title');
    const childrenToMove = Array.from(section.children).filter(child => child !== title);
    childrenToMove.forEach(child => content.appendChild(child));
    section.appendChild(content);
  }
  
  // Create summary element
  const summary = createSummaryElement(getParentSummary(parentNumber));
  section.appendChild(summary);
  
  // Create toggle button
  const button = createCollapseButton(sectionId, 'Edit', 'Collapse');
  
  // Insert button in title
  const title = section.querySelector('.section-title');
  if (title) {
    title.appendChild(button);
  }
  
  // Add click handler
  button.addEventListener('click', () => {
    toggleSection(section, button, content, summary);
  });
  
  // Add keyboard handler
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      button.click();
    }
  });
  
  // Listen for input changes to update summary and handle auto-collapse
  const allInputs = section.querySelectorAll('input, select');
  allInputs.forEach(input => {
    // Update summary on change
    input.addEventListener('change', () => {
      summary.innerHTML = getParentSummary(parentNumber);
    });
    
    // Auto-collapse on mobile/tablet after all required data is entered
    input.addEventListener('blur', () => {
      // Only auto-collapse if section is complete and on mobile/tablet
      if (isParentSectionComplete(parentNumber) && isMobileOrTablet()) {
        // Delay collapse slightly to allow user to continue entering data
        setTimeout(() => {
          const isExpanded = button.getAttribute('aria-expanded') === 'true';
          if (isExpanded) {
            toggleSection(section, button, content, summary);
          }
        }, 800);
      }
    });
  });
}

/**
 * Initialize collapsible functionality for a child card
 * @param {HTMLElement} childCard - The child card element
 */
export function initializeChildCollapse(childCard) {
  if (!childCard) return;
  
  // Skip if already initialized
  if (childCard.dataset.collapseInitialized === 'true') return;
  childCard.dataset.collapseInitialized = 'true';
  
  const childIndex = childCard.dataset.childIndex;
  const sectionId = `child-${childIndex}-content`;
  
  // Find or create content wrapper
  let content = childCard.querySelector('.child-card-content');
  if (!content) {
    content = document.createElement('div');
    content.className = 'child-card-content';
    content.id = sectionId;
    
    // Move all card children (except header) into content wrapper
    const header = childCard.querySelector('.child-card-header');
    const childrenToMove = Array.from(childCard.children).filter(child => child !== header);
    childrenToMove.forEach(child => content.appendChild(child));
    childCard.appendChild(content);
  }
  
  // Create summary element
  const summary = createSummaryElement(getChildSummary(childIndex));
  childCard.appendChild(summary);
  
  // Create toggle button
  const button = createCollapseButton(sectionId, 'Edit', 'Collapse');
  
  // Insert button in header
  const header = childCard.querySelector('.child-card-header');
  if (header) {
    // Insert before remove button
    const removeBtn = header.querySelector('.remove-child-btn');
    if (removeBtn) {
      header.insertBefore(button, removeBtn);
    } else {
      header.appendChild(button);
    }
  }
  
  // Add click handler
  button.addEventListener('click', () => {
    toggleSection(childCard, button, content, summary);
  });
  
  // Add keyboard handler
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      button.click();
    }
  });
  
  // Listen for input changes to update summary and handle auto-collapse
  const allInputs = childCard.querySelectorAll('input, select');
  allInputs.forEach(input => {
    // Update summary on change
    input.addEventListener('change', () => {
      summary.innerHTML = getChildSummary(childIndex);
    });
    
    // Auto-collapse on mobile/tablet after all required data is entered
    input.addEventListener('blur', () => {
      // Only auto-collapse if card is complete and on mobile/tablet
      if (isChildCardComplete(childIndex) && isMobileOrTablet()) {
        // Delay collapse to allow user to continue entering data
        setTimeout(() => {
          const isExpanded = button.getAttribute('aria-expanded') === 'true';
          if (isExpanded) {
            toggleSection(childCard, button, content, summary);
          }
        }, 800);
      }
    });
  });
}

/**
 * Initialize all parent and child collapses
 */
export function initializeAllCollapses() {
  // Initialize parent sections
  initializeParentCollapse(1);
  initializeParentCollapse(2);
  
  // Initialize existing child cards
  const childCards = document.querySelectorAll('.child-card');
  childCards.forEach(card => initializeChildCollapse(card));
  
  // Observe for new child cards being added
  const childrenContainer = document.getElementById('children-container');
  if (childrenContainer) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList.contains('child-card')) {
            initializeChildCollapse(node);
          }
        });
      });
    });
    
    observer.observe(childrenContainer, { childList: true });
  }
}
