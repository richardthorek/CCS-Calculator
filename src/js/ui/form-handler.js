/**
 * Form Handler Module
 * Handles form interactions, validation, and calculation integration
 */

import { calculateAdjustedIncome, calculateHouseholdIncome } from '../calculations/income.js';
import { calculateStandardRate, calculateHigherRate } from '../calculations/subsidy-rate.js';
import { calculateSubsidisedHours } from '../calculations/activity-test.js';
import { calculateWeeklyCosts } from '../calculations/costs.js';
import { HOURLY_RATE_CAPS } from '../config/ccs-config.js';

/**
 * Initialize the calculator form
 */
export function initializeForm() {
  const form = document.getElementById('ccs-calculator-form');
  const addChildBtn = document.getElementById('add-child-btn');
  const resetBtn = document.getElementById('reset-btn');
  
  // Add first child by default
  addChild();
  
  // Event listeners
  addChildBtn.addEventListener('click', addChild);
  form.addEventListener('submit', handleFormSubmit);
  resetBtn.addEventListener('click', handleReset);
  
  console.log('Form initialized');
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
  } catch (error) {
    console.error('Calculation error:', error);
    showGlobalError('An error occurred during calculation. Please check your inputs and try again.');
  }
}

/**
 * Collect all form data
 */
function collectFormData() {
  // Parent 1 data
  const parent1Income = parseFloat(document.getElementById('parent1-income').value) || 0;
  const parent1Days = parseFloat(document.getElementById('parent1-days').value) || 0;
  const parent1Hours = parseFloat(document.getElementById('parent1-hours').value) || 0;
  
  // Parent 2 data (optional)
  const parent2Income = parseFloat(document.getElementById('parent2-income').value) || 0;
  const parent2Days = parseFloat(document.getElementById('parent2-days').value) || 0;
  const parent2Hours = parseFloat(document.getElementById('parent2-hours').value) || 0;
  
  // Children data
  const childCards = document.querySelectorAll('.child-card');
  const children = Array.from(childCards).map((card, index) => {
    const childIndex = card.dataset.childIndex;
    return {
      age: parseFloat(card.querySelector(`#child-${childIndex}-age`).value) || 0,
      careType: card.querySelector(`#child-${childIndex}-care-type`).value,
      hoursPerWeek: parseFloat(card.querySelector(`#child-${childIndex}-hours`).value) || 0,
      providerFee: parseFloat(card.querySelector(`#child-${childIndex}-fee`).value) || 0,
    };
  });
  
  return {
    parent1: { income: parent1Income, days: parent1Days, hours: parent1Hours },
    parent2: { income: parent2Income, days: parent2Days, hours: parent2Hours },
    children
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
    
    if (!child.age || child.age < 0 || child.age > 18) {
      showError(`child-${childIndex}-age`, 'Age must be between 0 and 18');
      isValid = false;
    }
    
    if (!child.hoursPerWeek || child.hoursPerWeek <= 0 || child.hoursPerWeek > 100) {
      showError(`child-${childIndex}-hours`, 'Hours per week must be between 1 and 100');
      isValid = false;
    }
    
    if (!child.providerFee || child.providerFee <= 0) {
      showError(`child-${childIndex}-fee`, 'Provider fee must be greater than 0');
      isValid = false;
    }
  });
  
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
  
  // Calculate activity test hours
  const parent1HoursPerFortnight = formData.parent1.days * formData.parent1.hours * 2;
  const parent2HoursPerFortnight = formData.parent2.days * formData.parent2.hours * 2;
  
  const subsidisedHoursPerWeek = calculateSubsidisedHours(
    parent1HoursPerFortnight,
    parent2HoursPerFortnight
  );
  
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
    
    // Determine if school age
    const isSchoolAge = child.age >= 6;
    
    // Calculate weekly costs
    const costs = calculateWeeklyCosts(
      child.providerFee,
      subsidyRate,
      child.hoursPerWeek,
      subsidisedHoursPerWeek,
      child.careType,
      isSchoolAge
    );
    
    return {
      childNumber: index + 1,
      age: child.age,
      careType: child.careType,
      hoursPerWeek: child.hoursPerWeek,
      providerFee: child.providerFee,
      subsidyRate,
      ...costs
    };
  });
  
  // Calculate totals
  const totalWeeklySubsidy = childrenResults.reduce((sum, child) => sum + child.weeklySubsidy, 0);
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
    totalWeeklySubsidy,
    totalWeeklyCost,
    totalWeeklyGap,
    annualOutOfPocket,
    netAnnualIncome,
    costAsPercentageOfIncome,
    childrenResults
  };
}

/**
 * Display calculation results
 */
function displayResults(results) {
  const resultsSection = document.getElementById('results-section');
  
  // Update summary cards
  document.getElementById('result-household-income').textContent = formatCurrency(results.householdIncome);
  document.getElementById('result-weekly-subsidy').textContent = formatCurrency(results.totalWeeklySubsidy);
  document.getElementById('result-weekly-gap').textContent = formatCurrency(results.totalWeeklyGap);
  document.getElementById('result-net-income').textContent = formatCurrency(results.netAnnualIncome);
  
  // Update activity test info
  document.getElementById('result-subsidised-hours').textContent = results.subsidisedHoursPerWeek.toFixed(0);
  document.getElementById('result-cost-percentage').textContent = formatPercentage(results.costAsPercentageOfIncome);
  
  // Display children results
  const childrenResultsContainer = document.getElementById('children-results');
  childrenResultsContainer.innerHTML = results.childrenResults.map(child => `
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
          <span class="result-value">${formatCurrency(child.weeklySubsidy)}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Weekly Full Cost:</span>
          <span class="result-value">${formatCurrency(child.weeklyFullCost)}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Weekly Out-of-Pocket:</span>
          <span class="result-value highlight">${formatCurrency(child.weeklyOutOfPocket)}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  // Show results section
  resultsSection.hidden = false;
  
  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Add a new child input card
 */
let childCounter = 0;

function addChild() {
  const container = document.getElementById('children-container');
  const childIndex = childCounter++;
  
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
    
    <div class="form-row">
      <div class="form-group">
        <label for="child-${childIndex}-hours">
          Hours per Week
          <span class="required" aria-label="required">*</span>
        </label>
        <input 
          type="number" 
          id="child-${childIndex}-hours" 
          name="child-${childIndex}-hours"
          min="1" 
          max="100"
          step="0.5"
          required
          aria-required="true"
          aria-describedby="child-${childIndex}-hours-error"
        >
        <span class="error-message" id="child-${childIndex}-hours-error" role="alert"></span>
      </div>
      
      <div class="form-group">
        <label for="child-${childIndex}-fee">
          Provider Hourly Fee (AUD)
          <span class="required" aria-label="required">*</span>
        </label>
        <div class="input-wrapper">
          <span class="input-prefix">$</span>
          <input 
            type="number" 
            id="child-${childIndex}-fee" 
            name="child-${childIndex}-fee"
            min="0" 
            max="200"
            step="0.5"
            required
            aria-required="true"
            aria-describedby="child-${childIndex}-fee-error"
          >
        </div>
        <span class="error-message" id="child-${childIndex}-fee-error" role="alert"></span>
      </div>
    </div>
  `;
  
  container.appendChild(childCard);
  
  // Add remove button handler
  const removeBtn = childCard.querySelector('.remove-child-btn');
  removeBtn.addEventListener('click', () => removeChild(childCard));
  
  // Update numbering
  updateChildNumbering();
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
 * Format currency value
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
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
