/**
 * Preset Scenarios Module
 * Handles common scenario presets for quick start
 */

// Define preset scenarios
const PRESETS = {
  'full-time-both': {
    name: 'Full-time Both Parents',
    description: '5 days per week each, typical full-time arrangement',
    parent1: {
      income: 80000,
      workDays: 5,
      hoursPerDay: 8
    },
    parent2: {
      income: 70000,
      workDays: 5,
      hoursPerDay: 8
    },
    children: [
      {
        age: 3,
        careType: 'centre-based-day-care',
        hourlyFee: 12.00,
        sessionsPerWeek: 5
      }
    ]
  },
  
  'full-time-one': {
    name: 'Full-time One Parent',
    description: 'One parent working, one at home',
    parent1: {
      income: 90000,
      workDays: 5,
      hoursPerDay: 8
    },
    parent2: {
      income: 0,
      workDays: 0,
      hoursPerDay: 0
    },
    children: [
      {
        age: 2,
        careType: 'centre-based-day-care',
        hourlyFee: 12.50,
        sessionsPerWeek: 5
      }
    ]
  },
  
  'part-time-both': {
    name: 'Part-time Both Parents',
    description: '3 days per week each',
    parent1: {
      income: 50000,
      workDays: 3,
      hoursPerDay: 8
    },
    parent2: {
      income: 45000,
      workDays: 3,
      hoursPerDay: 8
    },
    children: [
      {
        age: 4,
        careType: 'centre-based-day-care',
        hourlyFee: 11.50,
        sessionsPerWeek: 3
      }
    ]
  },
  
  'full-part': {
    name: 'Full-time + Part-time',
    description: 'One full-time (5 days), one part-time (3 days)',
    parent1: {
      income: 85000,
      workDays: 5,
      hoursPerDay: 8
    },
    parent2: {
      income: 40000,
      workDays: 3,
      hoursPerDay: 6
    },
    children: [
      {
        age: 2,
        careType: 'centre-based-day-care',
        hourlyFee: 13.00,
        sessionsPerWeek: 5
      }
    ]
  },
  
  'four-four': {
    name: 'Four Days Each',
    description: 'Both parents working 4 days per week',
    parent1: {
      income: 75000,
      workDays: 4,
      hoursPerDay: 8
    },
    parent2: {
      income: 70000,
      workDays: 4,
      hoursPerDay: 8
    },
    children: [
      {
        age: 3,
        careType: 'centre-based-day-care',
        hourlyFee: 12.00,
        sessionsPerWeek: 4
      }
    ]
  },
  
  'compressed': {
    name: 'Compressed Week',
    description: 'One parent working 4 long days, other at home',
    parent1: {
      income: 95000,
      workDays: 4,
      hoursPerDay: 10
    },
    parent2: {
      income: 0,
      workDays: 0,
      hoursPerDay: 0
    },
    children: [
      {
        age: 1,
        careType: 'centre-based-day-care',
        hourlyFee: 13.50,
        sessionsPerWeek: 4
      }
    ]
  }
};

/**
 * Initialize preset selector
 */
export function initializePresets() {
  const presetSelector = document.getElementById('scenario-preset');
  if (!presetSelector) {
    console.warn('Preset selector not found');
    return;
  }
  
  presetSelector.addEventListener('change', (e) => {
    const presetId = e.target.value;
    if (presetId && PRESETS[presetId]) {
      loadPreset(presetId);
    }
  });
}

/**
 * Load a preset scenario into the form
 * @param {string} presetId - ID of the preset to load
 */
function loadPreset(presetId) {
  const preset = PRESETS[presetId];
  if (!preset) {
    console.error('Preset not found:', presetId);
    return;
  }
  
  console.log('Loading preset:', preset.name);
  
  // Clear any existing children first
  clearChildren();
  
  // Wait a bit for UI to update
  setTimeout(() => {
    // Load Parent 1 data
    fillParentData(1, preset.parent1);
    
    // Load Parent 2 data
    fillParentData(2, preset.parent2);
    
    // Load children
    preset.children.forEach((childData, index) => {
      // Add child if needed
      if (index > 0) {
        addChild();
      }
      
      // Fill child data
      setTimeout(() => {
        fillChildData(index, childData);
      }, 100 * (index + 1));
    });
    
    // Show notification
    showPresetNotification(preset.name);
  }, 100);
}

/**
 * Fill parent data
 * @param {number} parentNum - Parent number (1 or 2)
 * @param {Object} data - Parent data
 */
function fillParentData(parentNum, data) {
  // Income
  const incomeInput = document.getElementById(`parent${parentNum}-income`);
  if (incomeInput) {
    incomeInput.value = data.income;
    incomeInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Hours per day
  const hoursInput = document.getElementById(`parent${parentNum}-hours`);
  if (hoursInput) {
    hoursInput.value = data.hoursPerDay;
    hoursInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Work days - check appropriate checkboxes
  const workDayCheckboxes = document.querySelectorAll(`input[name="parent${parentNum}-workday"]`);
  const daysToCheck = data.workDays;
  
  workDayCheckboxes.forEach((checkbox, index) => {
    checkbox.checked = index < daysToCheck;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/**
 * Fill child data
 * @param {number} childIndex - Child index (0-based)
 * @param {Object} data - Child data
 */
function fillChildData(childIndex, data) {
  const childCards = document.querySelectorAll('.child-card');
  if (childIndex >= childCards.length) {
    console.warn('Child card not found for index:', childIndex);
    return;
  }
  
  const card = childCards[childIndex];
  
  // Age
  const ageInput = card.querySelector('input[name$="-age"]');
  if (ageInput) {
    ageInput.value = data.age;
    ageInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Care type
  const careTypeSelect = card.querySelector('select[name$="-care-type"]');
  if (careTypeSelect) {
    careTypeSelect.value = data.careType;
    careTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Hourly fee
  const feeInput = card.querySelector('input[name$="-hourly-fee"]');
  if (feeInput) {
    feeInput.value = data.hourlyFee;
    feeInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Sessions per week
  const sessionsInput = card.querySelector('input[name$="-sessions"]');
  if (sessionsInput) {
    sessionsInput.value = data.sessionsPerWeek;
    sessionsInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Clear all children from the form
 */
function clearChildren() {
  const childrenContainer = document.getElementById('children-container');
  if (childrenContainer) {
    childrenContainer.innerHTML = '';
  }
}

/**
 * Add a child to the form
 */
function addChild() {
  const addChildBtn = document.getElementById('add-child-btn');
  if (addChildBtn) {
    addChildBtn.click();
  }
}

/**
 * Show notification that preset was loaded
 * @param {string} presetName - Name of the preset
 */
function showPresetNotification(presetName) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification-toast notification-info show';
  notification.textContent = `✓ Loaded preset: ${presetName}`;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Get all available presets
 * @returns {Object} Presets object
 */
export function getPresets() {
  return PRESETS;
}
