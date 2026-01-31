/**
 * Form Handler Module
 * Handles form interactions, validation, and calculation integration
 * Includes real-time event-driven updates with debouncing
 */

import { calculateAdjustedIncome, calculateHouseholdIncome } from '../calculations/income.js';
import { calculateStandardRate, calculateHigherRate } from '../calculations/subsidy-rate.js';
import { calculateSubsidisedHours, calculateSubsidisedDays } from '../calculations/activity-test.js';
import { 
  calculateEffectiveHourlyRate, 
  calculateSubsidyPerHour, 
  calculateWeeklyCosts,
  calculateEffectiveDailyRate,
  calculateSubsidyPerDay,
  calculateWeeklyCostsFromDailyRate
} from '../calculations/costs.js';
import { 
  calculateMinimumChildcareDays, 
  formatScheduleBreakdown,
  calculateCostSavings
} from '../calculations/parent-schedule.js';
import { debounce } from '../utils/debounce.js';
import { loadState, saveState } from '../storage/persistence.js';
import { stripCommas, formatWithCommas } from '../utils/format-input.js';

// Cache for calculation results to optimize performance
let lastFormData = null;
let lastResults = null;

// Default values for child inputs
const DEFAULT_HOURS_PER_DAY = '10';

/**
 * Initialize the calculator form
 */
export function initializeForm() {
  const form = document.getElementById('ccs-calculator-form');
  const addChildBtn = document.getElementById('add-child-btn');
  const resetBtn = document.getElementById('reset-btn');
  const applyAllBtn = document.getElementById('apply-all-btn');
  
  // Try to restore saved state
  const savedState = loadState();
  
  if (savedState && savedState.formData) {
    // Restore form data from localStorage
    restoreFormData(savedState.formData);
  } else {
    // Add first child by default if no saved state
    addChild();
  }
  
  // Event listeners for form submission
  addChildBtn.addEventListener('click', addChild);
  form.addEventListener('submit', handleFormSubmit);
  resetBtn.addEventListener('click', handleReset);
  applyAllBtn.addEventListener('click', handleApplyToAll);
  
  // Add real-time event listeners to all inputs (debounced)
  setupRealtimeUpdates();
  
  // Setup parent work day selection sync
  setupWorkDaySync();
  
  // Update adjusted income displays on initial load
  updateAdjustedIncomeDisplays();
  
  // Setup days of care auto-calculation
  setupDaysOfCareAutoCalculation();
  
  console.log('Form initialized with real-time updates');
}

/**
 * Setup real-time event listeners for all form inputs
 */
function setupRealtimeUpdates() {
  const form = document.getElementById('ccs-calculator-form');
  
  // Create debounced calculation function
  const debouncedCalculate = debounce(handleRealtimeCalculation, 500);
  
  // Create debounced save function
  const debouncedSave = debounce(saveCurrentState, 500);
  
  // Listen to input events on the form (using event delegation)
  form.addEventListener('input', (event) => {
    const target = event.target;
    
    // Only trigger for input fields, not buttons
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
      // Update adjusted income displays immediately (no debounce for better UX)
      updateAdjustedIncomeDisplays();
      
      // Show calculating indicator
      showCalculatingIndicator();
      
      // Trigger debounced calculation
      debouncedCalculate();
      
      // Trigger debounced save
      debouncedSave();
    }
  });
  
  // Also listen to change events for select elements
  form.addEventListener('change', (event) => {
    const target = event.target;
    
    if (target.tagName === 'SELECT') {
      showCalculatingIndicator();
      debouncedCalculate();
      debouncedSave();
    }
  });
}

/**
 * Update the adjusted income displays for both parents
 * Shows real-time calculation of income based on days and hours worked
 */
function updateAdjustedIncomeDisplays() {
  // Parent 1
  updateParentAdjustedIncome('parent1');
  
  // Parent 2
  updateParentAdjustedIncome('parent2');
}

/**
 * Update adjusted income display for a specific parent
 * @param {string} parentId - 'parent1' or 'parent2'
 */
function updateParentAdjustedIncome(parentId) {
  const incomeInput = document.getElementById(`${parentId}-income`);
  const daysInput = document.getElementById(`${parentId}-days`);
  const hoursInput = document.getElementById(`${parentId}-hours`);
  const displayElement = document.getElementById(`${parentId}-adjusted-income-display`);
  const valueElement = document.getElementById(`${parentId}-adjusted-income-value`);
  const percentageElement = document.getElementById(`${parentId}-income-percentage`);
  
  // Get values (strip commas from income)
  const incomeRaw = incomeInput.value || '0';
  const income = parseFloat(stripCommas(incomeRaw)) || 0;
  const days = parseFloat(daysInput.value) || 0;
  const hours = parseFloat(hoursInput.value) || 0;
  
  // Only show if income is entered
  if (income <= 0) {
    displayElement.classList.add('hidden');
    return;
  }
  
  // Calculate adjusted income
  const adjustedIncome = calculateAdjustedIncome(income, days, hours);
  
  // Calculate percentage of full-time based on days only (hours no longer affect income)
  const daysFactor = days / 5;
  const percentage = Math.round(daysFactor * 100);
  
  // Format and display
  valueElement.textContent = formatCurrency(adjustedIncome);
  
  // Show percentage if not 100%
  if (percentage !== 100) {
    percentageElement.textContent = `(${percentage}% of full-time)`;
  } else {
    percentageElement.textContent = '(full-time)';
  }
  
  // Show the display
  displayElement.classList.remove('hidden');
}

/**
 * Setup automatic calculation of days of care based on parent work schedules
 */
function setupDaysOfCareAutoCalculation() {
  const form = document.getElementById('ccs-calculator-form');
  
  // Listen for changes to parent work day checkboxes and days inputs
  form.addEventListener('change', (event) => {
    const target = event.target;
    
    // Check if it's a parent work day checkbox or days input
    if (target.name === 'parent1-workday' || 
        target.name === 'parent2-workday' ||
        target.id === 'parent1-days' ||
        target.id === 'parent2-days') {
      updateAllChildrenDaysOfCare();
    }
  });
  
  // Initial calculation
  setTimeout(() => updateAllChildrenDaysOfCare(), 100);
}

/**
 * Update days of care for all children based on parent work schedules
 * Only updates if the field hasn't been manually edited by the user
 */
function updateAllChildrenDaysOfCare() {
  // Get parent work days
  const parent1WorkDaysCheckboxes = document.querySelectorAll('input[name="parent1-workday"]:checked');
  const parent1WorkDays = Array.from(parent1WorkDaysCheckboxes).map(cb => cb.value);
  
  const parent2WorkDaysCheckboxes = document.querySelectorAll('input[name="parent2-workday"]:checked');
  const parent2WorkDays = Array.from(parent2WorkDaysCheckboxes).map(cb => cb.value);
  
  // Calculate minimum days needed
  const scheduleResult = calculateMinimumChildcareDays(parent1WorkDays, parent2WorkDays);
  const defaultDays = scheduleResult.daysCount;
  
  // Update each child's days of care input
  const daysOfCareInputs = document.querySelectorAll('.days-of-care-input');
  daysOfCareInputs.forEach(input => {
    // Only update if field is empty or hasn't been manually edited
    if (input.value === '' || input.dataset.autoCalculated === 'true') {
      input.value = defaultDays;
      input.dataset.autoCalculated = 'true';
      
      // Update help text
      const childIndex = input.dataset.childIndex;
      const helpText = document.getElementById(`child-${childIndex}-days-help`);
      if (helpText) {
        helpText.textContent = `Based on parent schedules (${scheduleResult.explanation})`;
      }
    }
  });
  
  // Mark manual edits
  daysOfCareInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.dataset.autoCalculated = 'false';
    }, { once: true });
  });
}

/**
 * Handle "Apply to All" button click
 */
function handleApplyToAll() {
  const applyAllInput = document.getElementById('apply-all-days');
  const daysValue = parseInt(applyAllInput.value);
  
  if (isNaN(daysValue) || daysValue < 0 || daysValue > 5) {
    alert('Please enter a valid number of days between 0 and 5');
    return;
  }
  
  // Apply to all children
  const daysOfCareInputs = document.querySelectorAll('.days-of-care-input');
  daysOfCareInputs.forEach(input => {
    input.value = daysValue;
    input.dataset.autoCalculated = 'false'; // Mark as manually set
  });
  
  // Clear the apply-all input
  applyAllInput.value = '';
  
  // Trigger recalculation
  handleRealtimeCalculation();
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Handle real-time calculation (called by debounced event handler)
 */
function handleRealtimeCalculation() {
  // Clear previous errors
  clearErrors();
  
  // Collect form data
  const formData = collectFormData();
  
  // Only calculate if data has changed
  if (isFormDataEqual(formData, lastFormData)) {
    hideCalculatingIndicator();
    return;
  }
  
  // Validate silently (don't show errors for incomplete forms during typing)
  if (!isFormDataComplete(formData)) {
    hideCalculatingIndicator();
    return;
  }
  
  // Full validation
  if (!validateFormData(formData)) {
    hideCalculatingIndicator();
    return;
  }
  
  // Calculate and display results
  try {
    const results = calculateCCS(formData);
    
    // Cache results
    lastFormData = formData;
    lastResults = results;
    
    displayResults(results);
    
    // Hide calculating indicator
    hideCalculatingIndicator();
    
    // Dispatch event for scenario generation
    document.dispatchEvent(new CustomEvent('calculationComplete', {
      detail: { formData, results }
    }));
  } catch (error) {
    console.error('Calculation error:', error);
    hideCalculatingIndicator();
  }
}

/**
 * Helper function to check if a value is a valid positive number
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a valid positive number
 */
function isValidPositiveNumber(value) {
  return value !== null && value !== undefined && !isNaN(value) && value > 0;
}

/**
 * Check if form data is complete (has all required fields)
 */
function isFormDataComplete(formData) {
  // Check parent 1 required fields
  if (!formData.parent1.income || formData.parent1.income <= 0) return false;
  if (formData.parent1.days === null || formData.parent1.days === undefined) return false;
  if (formData.parent1.hours === null || formData.parent1.hours === undefined) return false;
  
  // Check if at least one child is added
  if (formData.children.length === 0) return false;
  
  // Check all children have required fields based on fee type
  for (const child of formData.children) {
    if (child.age === null || child.age === undefined) return false;
    
    // Validate based on fee type (daily or hourly, default to daily)
    const feeType = child.feeType || 'daily';
    
    if (feeType === 'daily') {
      // For daily fee mode, check dailyFee and hoursPerDay
      if (!isValidPositiveNumber(child.dailyFee)) return false;
      if (!isValidPositiveNumber(child.hoursPerDay)) return false;
    } else if (feeType === 'hourly') {
      // For hourly fee mode, check hoursPerWeek and providerFee
      if (!isValidPositiveNumber(child.hoursPerWeek)) return false;
      if (!isValidPositiveNumber(child.providerFee)) return false;
    } else {
      // Unexpected fee type - require both sets of fields to be safe
      return false;
    }
  }
  
  return true;
}

/**
 * Check if two form data objects are equal
 * Uses shallow comparison for performance and property order independence
 */
function isFormDataEqual(data1, data2) {
  if (!data1 || !data2) return false;
  
  // Compare parent 1
  if (data1.parent1.income !== data2.parent1.income) return false;
  if (data1.parent1.days !== data2.parent1.days) return false;
  if (data1.parent1.hours !== data2.parent1.hours) return false;
  
  // Compare parent 2
  if (data1.parent2.income !== data2.parent2.income) return false;
  if (data1.parent2.days !== data2.parent2.days) return false;
  if (data1.parent2.hours !== data2.parent2.hours) return false;
  
  // Compare children count
  if (data1.children.length !== data2.children.length) return false;
  
  // Compare each child
  for (let i = 0; i < data1.children.length; i++) {
    const child1 = data1.children[i];
    const child2 = data2.children[i];
    
    if (child1.age !== child2.age) return false;
    if (child1.careType !== child2.careType) return false;
    if (child1.hoursPerWeek !== child2.hoursPerWeek) return false;
    if (child1.providerFee !== child2.providerFee) return false;
  }
  
  return true;
}

/**
 * Show calculating indicator
 */
function showCalculatingIndicator() {
  const resultsSection = document.getElementById('results-section');
  if (resultsSection && !resultsSection.hidden) {
    resultsSection.classList.add('calculating');
  }
}

/**
 * Hide calculating indicator
 */
function hideCalculatingIndicator() {
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.classList.remove('calculating');
  }
}

/**
 * Handle form submission
 */
function handleFormSubmit(event) {
  event.preventDefault();
  
  // Clear previous errors
  clearErrors();
  
  // Collect and validate form data
  const formData = collectFormData();
  
  if (!validateFormData(formData)) {
    return;
  }
  
  // Calculate results
  try {
    const results = calculateCCS(formData);
    displayResults(results);
    
    // Dispatch event for scenario generation
    document.dispatchEvent(new CustomEvent('calculationComplete', {
      detail: { formData, results }
    }));
  } catch (error) {
    console.error('Calculation error:', error);
    showGlobalError('An error occurred during calculation. Please check your inputs and try again.');
  }
}

/**
 * Collect all form data
 */
function collectFormData() {
  // Parent 1 data (strip commas from income for numeric parsing)
  const parent1IncomeRaw = document.getElementById('parent1-income').value || '0';
  const parent1Income = parseFloat(stripCommas(parent1IncomeRaw)) || 0;
  const parent1Days = parseFloat(document.getElementById('parent1-days').value) || 0;
  const parent1Hours = parseFloat(document.getElementById('parent1-hours').value) || 0;
  
  // Parent 1 work days
  const parent1WorkDaysCheckboxes = document.querySelectorAll('input[name="parent1-workday"]:checked');
  const parent1WorkDays = Array.from(parent1WorkDaysCheckboxes).map(cb => cb.value);
  
  // Parent 2 data (optional, strip commas from income)
  const parent2IncomeRaw = document.getElementById('parent2-income').value || '0';
  const parent2Income = parseFloat(stripCommas(parent2IncomeRaw)) || 0;
  const parent2Days = parseFloat(document.getElementById('parent2-days').value) || 0;
  const parent2Hours = parseFloat(document.getElementById('parent2-hours').value) || 0;
  
  // Parent 2 work days
  const parent2WorkDaysCheckboxes = document.querySelectorAll('input[name="parent2-workday"]:checked');
  const parent2WorkDays = Array.from(parent2WorkDaysCheckboxes).map(cb => cb.value);
  
  // Children data
  const childCards = document.querySelectorAll('.child-card');
  const children = Array.from(childCards).map((card, index) => {
    const childIndex = card.dataset.childIndex;
    const ageValue = card.querySelector(`#child-${childIndex}-age`).value;
    const careType = card.querySelector(`#child-${childIndex}-care-type`).value;
    
    // Get fee type (daily or hourly)
    const feeTypeRadio = card.querySelector(`input[name="child-${childIndex}-fee-type"]:checked`);
    const feeType = feeTypeRadio ? feeTypeRadio.value : 'daily';
    
    let childData = {
      age: ageValue !== '' ? parseFloat(ageValue) : null,
      careType,
      feeType
    };
    
    if (feeType === 'daily') {
      const dailyFeeValue = card.querySelector(`#child-${childIndex}-daily-fee`).value;
      const hoursPerDayValue = card.querySelector(`#child-${childIndex}-hours-per-day`).value;
      const daysOfCareValue = card.querySelector(`#child-${childIndex}-days-of-care`).value;
      
      childData.dailyFee = dailyFeeValue !== '' ? parseFloat(dailyFeeValue) : null;
      childData.hoursPerDay = hoursPerDayValue !== '' ? parseFloat(hoursPerDayValue) : 10;
      childData.daysOfCare = daysOfCareValue !== '' ? parseFloat(daysOfCareValue) : null;
    } else {
      // Hourly mode
      const hourlyFeeValue = card.querySelector(`#child-${childIndex}-hourly-fee`).value;
      const hoursPerWeekValue = card.querySelector(`#child-${childIndex}-hours-per-week`).value;
      
      childData.providerFee = hourlyFeeValue !== '' ? parseFloat(hourlyFeeValue) : null;
      childData.hoursPerWeek = hoursPerWeekValue !== '' ? parseFloat(hoursPerWeekValue) : null;
    }
    
    return childData;
  });
  
  // CCS Settings
  const withholdingRateValue = document.getElementById('withholding-rate').value;
  const withholdingRate = withholdingRateValue !== '' ? parseFloat(withholdingRateValue) : 5;
  
  return {
    parent1: { 
      income: parent1Income, 
      days: parent1Days, 
      hours: parent1Hours,
      workDays: parent1WorkDays 
    },
    parent2: { 
      income: parent2Income, 
      days: parent2Days, 
      hours: parent2Hours,
      workDays: parent2WorkDays 
    },
    children,
    withholdingRate
  };
}

/**
 * Validate form data
 */
function validateFormData(formData) {
  let isValid = true;
  
  // Validate Parent 1 (required)
  if (!formData.parent1.income || formData.parent1.income <= 0) {
    showError('parent1-income', 'Please enter a valid income');
    isValid = false;
  }
  
  if (formData.parent1.days < 0 || formData.parent1.days > 5) {
    showError('parent1-days', 'Work days must be between 0 and 5');
    isValid = false;
  }
  
  if (formData.parent1.hours < 0 || formData.parent1.hours > 24) {
    showError('parent1-hours', 'Work hours must be between 0 and 24');
    isValid = false;
  }
  
  // Validate Parent 2 (if provided)
  if (formData.parent2.income > 0) {
    if (formData.parent2.days < 0 || formData.parent2.days > 5) {
      showError('parent2-days', 'Work days must be between 0 and 5');
      isValid = false;
    }
    
    if (formData.parent2.hours < 0 || formData.parent2.hours > 24) {
      showError('parent2-hours', 'Work hours must be between 0 and 24');
      isValid = false;
    }
  }
  
  // Validate children
  if (formData.children.length === 0) {
    showGlobalError('Please add at least one child');
    isValid = false;
  }
  
  formData.children.forEach((child, index) => {
    const childIndex = document.querySelectorAll('.child-card')[index].dataset.childIndex;
    
    if (child.age === null || child.age === undefined || isNaN(child.age) || child.age < 0 || child.age > 18) {
      showError(`child-${childIndex}-age`, 'Age must be between 0 and 18');
      isValid = false;
    }
    
    // Validate based on fee type
    if (child.feeType === 'daily') {
      if (child.dailyFee === null || child.dailyFee === undefined || isNaN(child.dailyFee) || child.dailyFee <= 0) {
        showError(`child-${childIndex}-daily-fee`, 'Daily fee must be greater than 0');
        isValid = false;
      }
      
      if (child.hoursPerDay === null || child.hoursPerDay === undefined || isNaN(child.hoursPerDay) || child.hoursPerDay <= 0 || child.hoursPerDay > 24) {
        showError(`child-${childIndex}-hours-per-day`, 'Hours per day must be between 1 and 24');
        isValid = false;
      }
    } else {
      // Hourly mode validation
      if (child.hoursPerWeek === null || child.hoursPerWeek === undefined || isNaN(child.hoursPerWeek) || child.hoursPerWeek <= 0 || child.hoursPerWeek > 100) {
        showError(`child-${childIndex}-hours-per-week`, 'Hours per week must be between 1 and 100');
        isValid = false;
      }
      
      if (child.providerFee === null || child.providerFee === undefined || isNaN(child.providerFee) || child.providerFee <= 0) {
        showError(`child-${childIndex}-hourly-fee`, 'Hourly fee must be greater than 0');
        isValid = false;
      }
    }
  });
  
  // Validate parent 1 work days match work days count
  if (formData.parent1.workDays.length !== formData.parent1.days && formData.parent1.days > 0) {
    showError('parent1-workdays', `Please select exactly ${formData.parent1.days} work day(s)`);
    isValid = false;
  }
  
  // Validate parent 2 work days if applicable
  if (formData.parent2.income > 0 && formData.parent2.days > 0) {
    if (formData.parent2.workDays.length !== formData.parent2.days) {
      showError('parent2-workdays', `Please select exactly ${formData.parent2.days} work day(s)`);
      isValid = false;
    }
  }
  
  return isValid;
}

/**
 * Calculate CCS results
 */
function calculateCCS(formData) {
  // Calculate adjusted incomes
  const parent1Adjusted = calculateAdjustedIncome(
    formData.parent1.income,
    formData.parent1.days,
    formData.parent1.hours
  );
  
  const parent2Adjusted = formData.parent2.income > 0
    ? calculateAdjustedIncome(
        formData.parent2.income,
        formData.parent2.days,
        formData.parent2.hours
      )
    : 0;
  
  const householdIncome = calculateHouseholdIncome(parent1Adjusted, parent2Adjusted);
  
  // Calculate minimum childcare days needed based on parent schedules
  const scheduleResult = calculateMinimumChildcareDays(
    formData.parent1.workDays,
    formData.parent2.workDays
  );
  const scheduleBreakdown = formatScheduleBreakdown(scheduleResult);
  
  // Calculate activity test hours and days
  const parent1HoursPerFortnight = formData.parent1.days * formData.parent1.hours * 2;
  const parent2HoursPerFortnight = formData.parent2.days * formData.parent2.hours * 2;
  
  const subsidisedHoursResult = calculateSubsidisedHours(
    parent1HoursPerFortnight,
    parent2HoursPerFortnight
  );
  const subsidisedHoursPerWeek = subsidisedHoursResult.hoursPerWeek;
  
  // Calculate costs for each child
  const childrenResults = formData.children.map((child, index) => {
    // Determine subsidy rate based on child order and age
    const isEldestChildUnder5 = index === 0 && child.age <= 5;
    const isYoungerSiblingUnder5 = index > 0 && child.age <= 5;
    
    let subsidyRate;
    if (isEldestChildUnder5) {
      subsidyRate = calculateStandardRate(householdIncome);
    } else if (isYoungerSiblingUnder5) {
      subsidyRate = calculateHigherRate(householdIncome);
    } else {
      // School age children use standard rate
      subsidyRate = calculateStandardRate(householdIncome);
    }
    
    let costs;
    
    if (child.feeType === 'daily') {
      // Daily rate mode
      const effectiveDailyRate = calculateEffectiveDailyRate(
        child.dailyFee,
        child.careType,
        child.age,
        child.hoursPerDay
      );
      
      const subsidyPerDay = calculateSubsidyPerDay(subsidyRate, effectiveDailyRate);
      
      // Calculate subsidised days from activity test
      const subsidisedDaysResult = calculateSubsidisedDays(
        parent1HoursPerFortnight,
        parent2HoursPerFortnight,
        child.hoursPerDay
      );
      
      // Use user-specified days of care, or fall back to calculated minimum
      const actualDaysNeeded = child.daysOfCare !== null && child.daysOfCare !== undefined
        ? child.daysOfCare
        : scheduleResult.daysCount;
      
      costs = calculateWeeklyCostsFromDailyRate({
        subsidyPerDay,
        providerDailyFee: child.dailyFee,
        subsidisedDays: subsidisedDaysResult.daysPerWeek,
        actualDays: actualDaysNeeded,
        withholdingRate: formData.withholdingRate
      });
      
      // Calculate cost savings
      const savings = calculateCostSavings(5, actualDaysNeeded, child.dailyFee);
      
      return {
        childNumber: index + 1,
        age: child.age,
        careType: child.careType,
        feeType: 'daily',
        dailyFee: child.dailyFee,
        hoursPerDay: child.hoursPerDay,
        actualDaysNeeded,
        daysWithoutCare: savings.daysWithoutCare,
        subsidyRate,
        subsidyPerDay,
        effectiveDailyRate,
        ...costs,
        savings
      };
    } else {
      // Hourly rate mode (legacy)
      const effectiveHourlyRate = calculateEffectiveHourlyRate(
        child.providerFee,
        child.careType,
        child.age
      );
      
      const subsidyPerHour = calculateSubsidyPerHour(subsidyRate, effectiveHourlyRate);
      
      costs = calculateWeeklyCosts({
        subsidyPerHour,
        providerFee: child.providerFee,
        subsidisedHours: subsidisedHoursPerWeek,
        actualHours: child.hoursPerWeek,
        withholdingRate: formData.withholdingRate
      });
      
      return {
        childNumber: index + 1,
        age: child.age,
        careType: child.careType,
        feeType: 'hourly',
        hoursPerWeek: child.hoursPerWeek,
        providerFee: child.providerFee,
        subsidyRate,
        ...costs
      };
    }
  });
  
  // Calculate totals
  const totalWeeklySubsidy = childrenResults.reduce((sum, child) => sum + child.weeklySubsidy, 0);
  const totalWeeklyGrossSubsidy = childrenResults.reduce((sum, child) => sum + child.weeklyGrossSubsidy, 0);
  const totalWeeklyWithheld = childrenResults.reduce((sum, child) => sum + child.weeklyWithheld, 0);
  const totalWeeklyCost = childrenResults.reduce((sum, child) => sum + child.weeklyFullCost, 0);
  const totalWeeklyGap = childrenResults.reduce((sum, child) => sum + child.weeklyOutOfPocket, 0);
  
  const annualOutOfPocket = totalWeeklyGap * 52;
  const netAnnualIncome = householdIncome - annualOutOfPocket;
  const costAsPercentageOfIncome = householdIncome > 0 
    ? (annualOutOfPocket / householdIncome) * 100 
    : 0;
  
  return {
    householdIncome,
    subsidisedHoursPerWeek,
    scheduleBreakdown,
    scheduleResult,
    totalWeeklySubsidy,
    totalWeeklyGrossSubsidy,
    totalWeeklyWithheld,
    totalWeeklyCost,
    totalWeeklyGap,
    annualOutOfPocket,
    netAnnualIncome,
    costAsPercentageOfIncome,
    childrenResults,
    withholdingRate: formData.withholdingRate
  };
}

/**
 * Display calculation results
 */
function displayResults(results) {
  const resultsSection = document.getElementById('results-section');
  
  // Update summary cards - key figures
  const householdIncomeEl = document.getElementById('result-household-income');
  if (householdIncomeEl) {
    householdIncomeEl.textContent = formatCurrency(results.householdIncome);
  }
  
  const weeklySubsidyEl = document.getElementById('result-weekly-subsidy');
  if (weeklySubsidyEl) {
    weeklySubsidyEl.textContent = formatCurrency(results.totalWeeklySubsidy);
    weeklySubsidyEl.dataset.weeklyValue = results.totalWeeklySubsidy;
  }
  
  const weeklyGapEl = document.getElementById('result-weekly-gap');
  if (weeklyGapEl) {
    weeklyGapEl.textContent = formatCurrency(results.totalWeeklyGap);
    weeklyGapEl.dataset.weeklyValue = results.totalWeeklyGap;
  }
  
  // Weekly full cost
  const weeklyCostEl = document.getElementById('result-weekly-cost');
  if (weeklyCostEl) {
    weeklyCostEl.textContent = formatCurrency(results.totalWeeklyCost);
    weeklyCostEl.dataset.weeklyValue = results.totalWeeklyCost;
  }
  
  // Subsidy breakdown
  const grossSubsidyEl = document.getElementById('result-gross-subsidy');
  if (grossSubsidyEl) {
    grossSubsidyEl.textContent = formatCurrency(results.totalWeeklyGrossSubsidy);
    grossSubsidyEl.dataset.weeklyValue = results.totalWeeklyGrossSubsidy;
  }
  
  const withheldAmountEl = document.getElementById('result-withheld-amount');
  if (withheldAmountEl) {
    withheldAmountEl.textContent = '-' + formatCurrency(results.totalWeeklyWithheld);
    withheldAmountEl.dataset.weeklyValue = results.totalWeeklyWithheld;
  }
  
  const paidSubsidyEl = document.getElementById('result-paid-subsidy');
  if (paidSubsidyEl) {
    paidSubsidyEl.textContent = formatCurrency(results.totalWeeklySubsidy);
    paidSubsidyEl.dataset.weeklyValue = results.totalWeeklySubsidy;
  }
  
  const withholdingRateDisplayEl = document.getElementById('result-withholding-rate');
  if (withholdingRateDisplayEl) {
    withholdingRateDisplayEl.textContent = results.withholdingRate;
  }
  
  // Net income
  const netIncomeEl = document.getElementById('result-net-income');
  if (netIncomeEl) {
    netIncomeEl.textContent = formatCurrency(results.netAnnualIncome);
  }
  
  // CCS rate (use first child's rate as representative)
  const ccsRateEl = document.getElementById('result-ccs-rate');
  if (ccsRateEl && results.childrenResults.length > 0) {
    ccsRateEl.textContent = formatPercentage(results.childrenResults[0].subsidyRate);
  }
  
  // Activity test info
  const subsidisedHoursEl = document.getElementById('result-subsidised-hours');
  if (subsidisedHoursEl) {
    subsidisedHoursEl.textContent = results.subsidisedHoursPerWeek.toFixed(0);
  }
  
  const costPercentageEl = document.getElementById('result-cost-percentage');
  if (costPercentageEl) {
    costPercentageEl.textContent = formatPercentage(results.costAsPercentageOfIncome);
  }
  
  // Care days needed - display the actual days childcare is needed
  const careDaysEl = document.getElementById('result-care-days');
  if (careDaysEl && results.scheduleBreakdown) {
    const daysCount = results.scheduleResult?.daysCount || 0;
    const daysString = results.scheduleBreakdown.childcareDays;
    
    if (daysCount === 0) {
      careDaysEl.textContent = 'None (parent home each day)';
    } else {
      careDaysEl.textContent = daysString;
    }
  }
  
  // Display schedule breakdown if available
  if (results.scheduleBreakdown) {
    displayScheduleBreakdown(results.scheduleBreakdown);
  }
  
  // Display children results
  const childrenResultsContainer = document.getElementById('children-results');
  if (childrenResultsContainer) {
    childrenResultsContainer.innerHTML = results.childrenResults.map(child => {
      if (child.feeType === 'daily') {
        return `
          <div class="child-result-card">
            <div class="child-result-header">
              Child ${child.childNumber} (${child.age} years old, ${formatCareType(child.careType)})
            </div>
            <div class="result-grid">
              <div class="result-item">
                <span class="result-label">CCS Rate:</span>
                <span class="result-value highlight">${formatPercentage(child.subsidyRate)}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Daily Fee:</span>
                <span class="result-value">${formatCurrency(child.dailyFee)}/day</span>
              </div>
              <div class="result-item">
                <span class="result-label">Days of Care:</span>
                <span class="result-value">${child.actualDaysNeeded} days/week</span>
              </div>
              <div class="result-item">
                <span class="result-label">Weekly Subsidy:</span>
                <span class="result-value" data-weekly-value="${child.weeklySubsidy}">${formatCurrency(child.weeklySubsidy)}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Weekly Out-of-Pocket:</span>
                <span class="result-value highlight" data-weekly-value="${child.weeklyOutOfPocket}">${formatCurrency(child.weeklyOutOfPocket)}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="child-result-card">
            <div class="child-result-header">
              Child ${child.childNumber} (${child.age} years old, ${formatCareType(child.careType)})
            </div>
            <div class="result-grid">
              <div class="result-item">
                <span class="result-label">CCS Rate:</span>
                <span class="result-value highlight">${formatPercentage(child.subsidyRate)}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Hours per Week:</span>
                <span class="result-value">${child.hoursPerWeek}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Provider Fee:</span>
                <span class="result-value">${formatCurrency(child.providerFee)}/hr</span>
              </div>
              <div class="result-item">
                <span class="result-label">Weekly Subsidy:</span>
                <span class="result-value" data-weekly-value="${child.weeklySubsidy}">${formatCurrency(child.weeklySubsidy)}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Weekly Out-of-Pocket:</span>
                <span class="result-value highlight" data-weekly-value="${child.weeklyOutOfPocket}">${formatCurrency(child.weeklyOutOfPocket)}</span>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');
  }
  
  // Show results section (no longer hidden by default)
  if (resultsSection) {
    resultsSection.hidden = false;
  }
}

/**
 * Display parent work schedule breakdown
 */
function displayScheduleBreakdown(scheduleBreakdown) {
  // Find or create schedule breakdown section in results
  let scheduleSection = document.getElementById('schedule-breakdown-section');
  
  if (!scheduleSection) {
    // Create it if it doesn't exist
    const detailedSection = document.getElementById('detailed-results-section');
    if (detailedSection) {
      scheduleSection = document.createElement('div');
      scheduleSection.id = 'schedule-breakdown-section';
      scheduleSection.className = 'schedule-breakdown-detail';
      detailedSection.querySelector('.detail-panel-content')?.appendChild(scheduleSection);
    }
  }
  
  if (scheduleSection) {
    scheduleSection.innerHTML = `
      <h4>Work & Childcare Schedule</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Parent 1 Works:</span>
          <span class="detail-value">${scheduleBreakdown.parent1Days}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Parent 2 Works:</span>
          <span class="detail-value">${scheduleBreakdown.parent2Days}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Childcare Needed:</span>
          <span class="detail-value highlight">${scheduleBreakdown.childcareDays}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Days Without Care:</span>
          <span class="detail-value success">${scheduleBreakdown.daysWithoutCare}</span>
        </div>
      </div>
      <p class="schedule-explanation">${scheduleBreakdown.explanation}</p>
    `;
  }
}

/**
 * Add a new child input card
 */
let childCounter = 0;

function addChild() {
  const container = document.getElementById('children-container');
  const childIndex = childCounter++;
  
  // Get values from first child to use as defaults for subsequent children
  const existingChildren = container.querySelectorAll('.child-card');
  let defaultDailyFee = '';
  let defaultHoursPerDay = DEFAULT_HOURS_PER_DAY;
  
  if (existingChildren.length > 0) {
    // Get values from first child
    const firstChild = existingChildren[0];
    const firstChildIndex = firstChild.dataset.childIndex;
    
    const dailyFeeInput = document.getElementById(`child-${firstChildIndex}-daily-fee`);
    const hoursPerDayInput = document.getElementById(`child-${firstChildIndex}-hours-per-day`);
    
    if (dailyFeeInput && dailyFeeInput.value) {
      defaultDailyFee = dailyFeeInput.value;
    }
    if (hoursPerDayInput && hoursPerDayInput.value) {
      defaultHoursPerDay = hoursPerDayInput.value;
    }
  }
  
  const childCard = document.createElement('div');
  childCard.className = 'child-card';
  childCard.setAttribute('role', 'listitem');
  childCard.dataset.childIndex = childIndex;
  
  childCard.innerHTML = `
    <div class="child-card-header">
      <h3 class="child-card-title">Child ${childIndex + 1}</h3>
      <button type="button" class="remove-child-btn" data-child-index="${childIndex}" aria-label="Remove child ${childIndex + 1}">
        Remove
      </button>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label for="child-${childIndex}-age">
          Age (years)
          <span class="required" aria-label="required">*</span>
        </label>
        <input 
          type="number" 
          id="child-${childIndex}-age" 
          name="child-${childIndex}-age"
          min="0" 
          max="18"
          step="1"
          required
          aria-required="true"
          aria-describedby="child-${childIndex}-age-error"
        >
        <span class="error-message" id="child-${childIndex}-age-error" role="alert"></span>
      </div>
      
      <div class="form-group">
        <label for="child-${childIndex}-care-type">
          Care Type
          <span class="required" aria-label="required">*</span>
        </label>
        <select 
          id="child-${childIndex}-care-type" 
          name="child-${childIndex}-care-type"
          required
          aria-required="true"
        >
          <option value="centre-based">Centre-Based Day Care</option>
          <option value="family-day-care">Family Day Care</option>
          <option value="oshc">Outside School Hours Care</option>
          <option value="in-home">In-Home Care</option>
        </select>
      </div>
    </div>
    
    <!-- Fee Type Selection -->
    <div class="form-group">
      <label>Fee Charging Method <span class="required" aria-label="required">*</span></label>
      <div class="radio-group">
        <label class="radio-label">
          <input 
            type="radio" 
            name="child-${childIndex}-fee-type" 
            value="daily"
            checked
          >
          <span>Daily Rate (most common)</span>
        </label>
        <label class="radio-label">
          <input 
            type="radio" 
            name="child-${childIndex}-fee-type" 
            value="hourly"
          >
          <span>Hourly Rate</span>
        </label>
      </div>
    </div>
    
    <!-- Daily Rate Fields (shown by default) -->
    <div class="daily-rate-fields" data-child-index="${childIndex}">
      <div class="form-row">
        <div class="form-group">
          <label for="child-${childIndex}-daily-fee">
            Daily Fee (AUD)
            <span class="required" aria-label="required">*</span>
          </label>
          <div class="input-wrapper">
            <span class="input-prefix">$</span>
            <input 
              type="number" 
              id="child-${childIndex}-daily-fee" 
              name="child-${childIndex}-daily-fee"
              min="0" 
              max="500"
              step="1"
              required
              aria-required="true"
              aria-describedby="child-${childIndex}-daily-fee-error"
              placeholder="e.g., 120"
              value="${defaultDailyFee}"
            >
          </div>
          <span class="error-message" id="child-${childIndex}-daily-fee-error" role="alert"></span>
          <span class="help-text">Typical range: $80-$200 per day</span>
        </div>
        
        <div class="form-group">
          <label for="child-${childIndex}-hours-per-day">
            Hours Charged per Day
            <span class="required" aria-label="required">*</span>
          </label>
          <input 
            type="number" 
            id="child-${childIndex}-hours-per-day" 
            name="child-${childIndex}-hours-per-day"
            min="1" 
            max="24"
            step="0.5"
            value="${defaultHoursPerDay}"
            required
            aria-required="true"
            aria-describedby="child-${childIndex}-hours-per-day-error"
          >
          <span class="error-message" id="child-${childIndex}-hours-per-day-error" role="alert"></span>
          <span class="help-text">Usually 8-12 hours</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="child-${childIndex}-days-of-care">
          Days of Care per Week
          <span class="required" aria-label="required">*</span>
        </label>
        <input 
          type="number" 
          id="child-${childIndex}-days-of-care" 
          name="child-${childIndex}-days-of-care"
          min="0" 
          max="5"
          step="1"
          required
          aria-required="true"
          aria-describedby="child-${childIndex}-days-of-care-error"
          class="days-of-care-input"
          data-child-index="${childIndex}"
        >
        <span class="error-message" id="child-${childIndex}-days-of-care-error" role="alert"></span>
        <span class="help-text" id="child-${childIndex}-days-help">Auto-calculated based on parent work schedules</span>
      </div>
    </div>
    
    <!-- Hourly Rate Fields (hidden by default) -->
    <div class="hourly-rate-fields hidden" data-child-index="${childIndex}">
      <div class="form-row">
        <div class="form-group">
          <label for="child-${childIndex}-hourly-fee">
            Hourly Fee (AUD)
            <span class="required" aria-label="required">*</span>
          </label>
          <div class="input-wrapper">
            <span class="input-prefix">$</span>
            <input 
              type="number" 
              id="child-${childIndex}-hourly-fee" 
              name="child-${childIndex}-hourly-fee"
              min="0" 
              max="50"
              step="0.5"
              aria-describedby="child-${childIndex}-hourly-fee-error"
              placeholder="e.g., 15"
            >
          </div>
          <span class="error-message" id="child-${childIndex}-hourly-fee-error" role="alert"></span>
        </div>
        
        <div class="form-group">
          <label for="child-${childIndex}-hours-per-week">
            Hours per Week
            <span class="required" aria-label="required">*</span>
          </label>
          <input 
            type="number" 
            id="child-${childIndex}-hours-per-week" 
            name="child-${childIndex}-hours-per-week"
            min="1" 
            max="100"
            step="0.5"
            aria-describedby="child-${childIndex}-hours-per-week-error"
          >
          <span class="error-message" id="child-${childIndex}-hours-per-week-error" role="alert"></span>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(childCard);
  
  // Add event listeners for fee type radio buttons
  const feeTypeRadios = childCard.querySelectorAll(`input[name="child-${childIndex}-fee-type"]`);
  feeTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => toggleFeeTypeFields(childIndex));
  });
  
  // Add remove button handler
  const removeBtn = childCard.querySelector('.remove-child-btn');
  removeBtn.addEventListener('click', () => removeChild(childCard));
  
  // Update numbering
  updateChildNumbering();
  
  // Update days of care for this new child
  updateAllChildrenDaysOfCare();
  
  // Show/hide apply-all control based on child count
  updateApplyAllControlVisibility();
}

/**
 * Toggle between daily and hourly rate fields
 */
function toggleFeeTypeFields(childIndex) {
  const dailyFields = document.querySelector(`.daily-rate-fields[data-child-index="${childIndex}"]`);
  const hourlyFields = document.querySelector(`.hourly-rate-fields[data-child-index="${childIndex}"]`);
  const selectedType = document.querySelector(`input[name="child-${childIndex}-fee-type"]:checked`).value;
  
  if (selectedType === 'daily') {
    dailyFields.classList.remove('hidden');
    hourlyFields.classList.add('hidden');
    
    // Make daily fields required, hourly optional
    dailyFields.querySelectorAll('input').forEach(input => {
      if (input.id.includes('daily-fee') || input.id.includes('hours-per-day')) {
        input.required = true;
      }
    });
    hourlyFields.querySelectorAll('input').forEach(input => {
      input.required = false;
    });
  } else {
    dailyFields.classList.add('hidden');
    hourlyFields.classList.remove('hidden');
    
    // Make hourly fields required, daily optional
    hourlyFields.querySelectorAll('input').forEach(input => {
      if (input.id.includes('hourly-fee') || input.id.includes('hours-per-week')) {
        input.required = true;
      }
    });
    dailyFields.querySelectorAll('input').forEach(input => {
      input.required = false;
    });
  }
}

/**
 * Remove a child card
 */
function removeChild(childCard) {
  const container = document.getElementById('children-container');
  const childCards = container.querySelectorAll('.child-card');
  
  // Prevent removing the last child
  if (childCards.length <= 1) {
    showGlobalError('You must have at least one child');
    return;
  }
  
  childCard.remove();
  updateChildNumbering();
  
  // Show/hide apply-all control based on child count
  updateApplyAllControlVisibility();
}

/**
 * Update child card numbering
 */
function updateChildNumbering() {
  const childCards = document.querySelectorAll('.child-card');
  childCards.forEach((card, index) => {
    const title = card.querySelector('.child-card-title');
    title.textContent = `Child ${index + 1}`;
    
    const removeBtn = card.querySelector('.remove-child-btn');
    removeBtn.setAttribute('aria-label', `Remove child ${index + 1}`);
  });
}

/**
 * Show/hide the "Apply to All Children" control based on number of children
 */
function updateApplyAllControlVisibility() {
  const childCards = document.querySelectorAll('.child-card');
  const applyAllControl = document.getElementById('apply-all-control');
  
  if (childCards.length > 1) {
    applyAllControl.classList.remove('hidden');
  } else {
    applyAllControl.classList.add('hidden');
  }
}

/**
 * Handle form reset
 */
function handleReset() {
  const form = document.getElementById('ccs-calculator-form');
  form.reset();
  
  // Remove all children except the first one
  const container = document.getElementById('children-container');
  const childCards = container.querySelectorAll('.child-card');
  for (let i = childCards.length - 1; i > 0; i--) {
    childCards[i].remove();
  }
  
  // Hide results
  document.getElementById('results-section').hidden = true;
  
  // Clear errors
  clearErrors();
  
  updateChildNumbering();
}

/**
 * Show error message for a field
 */
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (field && errorElement) {
    field.classList.add('error');
    errorElement.textContent = message;
  }
}

/**
 * Show global error message
 */
function showGlobalError(message) {
  alert(message); // Simple implementation - could be enhanced with a toast/modal
}

/**
 * Clear all error messages
 */
function clearErrors() {
  const errorFields = document.querySelectorAll('input.error, select.error');
  errorFields.forEach(field => field.classList.remove('error'));
  
  const errorMessages = document.querySelectorAll('.error-message');
  errorMessages.forEach(msg => msg.textContent = '');
}

/**
 * Setup work day selection sync
 * Syncs checkbox selection with days per week input
 */
function setupWorkDaySync() {
  // Parent 1 work days sync
  const parent1DaysInput = document.getElementById('parent1-days');
  const parent1Checkboxes = document.querySelectorAll('input[name="parent1-workday"]');
  
  // Update checkboxes when days input changes
  parent1DaysInput.addEventListener('change', () => {
    const days = parseInt(parent1DaysInput.value) || 0;
    parent1Checkboxes.forEach((checkbox, index) => {
      checkbox.checked = index < days;
    });
  });
  
  // Update days input when checkboxes change
  parent1Checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const checkedCount = document.querySelectorAll('input[name="parent1-workday"]:checked').length;
      parent1DaysInput.value = checkedCount;
    });
  });
  
  // Parent 2 work days sync
  const parent2DaysInput = document.getElementById('parent2-days');
  const parent2Checkboxes = document.querySelectorAll('input[name="parent2-workday"]');
  
  // Update checkboxes when days input changes
  parent2DaysInput.addEventListener('change', () => {
    const days = parseInt(parent2DaysInput.value) || 0;
    parent2Checkboxes.forEach((checkbox, index) => {
      checkbox.checked = index < days;
    });
  });
  
  // Update days input when checkboxes change
  parent2Checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const checkedCount = document.querySelectorAll('input[name="parent2-workday"]:checked').length;
      parent2DaysInput.value = checkedCount;
    });
  });
}

/**
 * Format percentage value
 */
function formatPercentage(value) {
  return `${value.toFixed(2)}%`;
}

/**
 * Format care type for display
 */
function formatCareType(careType) {
  const types = {
    'centre-based': 'Centre-Based Day Care',
    'family-day-care': 'Family Day Care',
    'oshc': 'Outside School Hours Care',
    'in-home': 'In-Home Care'
  };
  return types[careType] || careType;
}

/**
 * Save current form state to localStorage
 */
function saveCurrentState() {
  try {
    const formData = collectFormData();
    const state = {
      formData: formData,
      timestamp: new Date().toISOString()
    };
    saveState(state);
  } catch (error) {
    console.error('Error saving current state:', error);
  }
}

/**
 * Restore form data from saved state
 * @param {Object} formData - The saved form data
 */
function restoreFormData(formData) {
  if (!formData) return;
  
  try {
    // Restore Parent 1 data
    if (formData.parent1) {
      const parent1Income = document.getElementById('parent1-income');
      const parent1Days = document.getElementById('parent1-days');
      const parent1Hours = document.getElementById('parent1-hours');
      
      if (parent1Income && formData.parent1.income) {
        parent1Income.value = formatWithCommas(formData.parent1.income);
      }
      if (parent1Days && formData.parent1.days !== undefined) {
        parent1Days.value = formData.parent1.days;
      }
      if (parent1Hours && formData.parent1.hours !== undefined) {
        parent1Hours.value = formData.parent1.hours;
      }
      
      // Restore work days
      if (formData.parent1.workDays && Array.isArray(formData.parent1.workDays)) {
        formData.parent1.workDays.forEach(day => {
          const checkbox = document.querySelector(`input[name="parent1-workday"][value="${day}"]`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }
    }
    
    // Restore Parent 2 data
    if (formData.parent2) {
      const parent2Income = document.getElementById('parent2-income');
      const parent2Days = document.getElementById('parent2-days');
      const parent2Hours = document.getElementById('parent2-hours');
      
      if (parent2Income && formData.parent2.income) {
        parent2Income.value = formatWithCommas(formData.parent2.income);
      }
      if (parent2Days && formData.parent2.days !== undefined) {
        parent2Days.value = formData.parent2.days;
      }
      if (parent2Hours && formData.parent2.hours !== undefined) {
        parent2Hours.value = formData.parent2.hours;
      }
      
      // Restore work days
      if (formData.parent2.workDays && Array.isArray(formData.parent2.workDays)) {
        formData.parent2.workDays.forEach(day => {
          const checkbox = document.querySelector(`input[name="parent2-workday"][value="${day}"]`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }
    }
    
    // Restore children data
    if (formData.children && Array.isArray(formData.children) && formData.children.length > 0) {
      // Clear existing children first (except default)
      const childrenContainer = document.getElementById('children-container');
      if (childrenContainer) {
        childrenContainer.innerHTML = '';
      }
      
      // Add children from saved state
      formData.children.forEach((childData, index) => {
        addChild();
        
        // Get the child card that was just added
        const childCards = document.querySelectorAll('.child-card');
        const card = childCards[childCards.length - 1];
        
        if (!card) return;
        
        const childIndex = card.dataset.childIndex;
        
        // Restore age
        const ageInput = card.querySelector(`#child-${childIndex}-age`);
        if (ageInput && childData.age !== null && childData.age !== undefined) {
          ageInput.value = childData.age;
        }
        
        // Restore care type
        const careTypeSelect = card.querySelector(`#child-${childIndex}-care-type`);
        if (careTypeSelect && childData.careType) {
          careTypeSelect.value = childData.careType;
        }
        
        // Restore fee type
        if (childData.feeType) {
          const feeTypeRadio = card.querySelector(`input[name="child-${childIndex}-fee-type"][value="${childData.feeType}"]`);
          if (feeTypeRadio) {
            feeTypeRadio.checked = true;
            // Trigger change event to show/hide appropriate fields
            feeTypeRadio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        
        // Restore daily fee fields
        if (childData.feeType === 'daily') {
          const dailyFeeInput = card.querySelector(`#child-${childIndex}-daily-fee`);
          const hoursPerDayInput = card.querySelector(`#child-${childIndex}-hours-per-day`);
          
          if (dailyFeeInput && childData.dailyFee !== null && childData.dailyFee !== undefined) {
            dailyFeeInput.value = childData.dailyFee;
          }
          if (hoursPerDayInput && childData.hoursPerDay !== null && childData.hoursPerDay !== undefined) {
            hoursPerDayInput.value = childData.hoursPerDay;
          }
        }
        
        // Restore hourly fee fields
        if (childData.feeType === 'hourly') {
          const hourlyFeeInput = card.querySelector(`#child-${childIndex}-hourly-fee`);
          const hoursPerWeekInput = card.querySelector(`#child-${childIndex}-hours-per-week`);
          
          if (hourlyFeeInput && childData.providerFee !== null && childData.providerFee !== undefined) {
            hourlyFeeInput.value = childData.providerFee;
          }
          if (hoursPerWeekInput && childData.hoursPerWeek !== null && childData.hoursPerWeek !== undefined) {
            hoursPerWeekInput.value = childData.hoursPerWeek;
          }
        }
      });
    }
    
    // Restore withholding rate
    if (formData.withholdingRate !== undefined) {
      const withholdingRateInput = document.getElementById('withholding-rate');
      if (withholdingRateInput) {
        withholdingRateInput.value = formData.withholdingRate;
      }
    }
    
    console.log('Form data restored from localStorage');
    
    // Trigger calculation after restoration
    setTimeout(() => {
      handleRealtimeCalculation();
    }, 100);
  } catch (error) {
    console.error('Error restoring form data:', error);
  }
}
