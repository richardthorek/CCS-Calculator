/**
 * Income Calculation Module
 * Calculates adjusted income for individual parents and household income
 * Based on 2025-26 CCS policy requirements
 */

/**
 * Calculate adjusted income for a single parent
 * Formula: (Base Annual Income) × (Work Days per Week ÷ 5)
 * 
 * This provides clean income percentages based on days worked:
 * - 1 day = 20% of full-time income
 * - 2 days = 40% of full-time income
 * - 3 days = 60% of full-time income
 * - 4 days = 80% of full-time income
 * - 5 days = 100% of full-time income
 * 
 * Note: workHoursPerDay parameter is kept for backwards compatibility but is no longer
 * used in the calculation. Hours per day is still used for childcare cost calculations
 * and activity test calculations, but not for income adjustment.
 * 
 * @param {number} annualIncome - Base annual income in AUD (full-time equivalent)
 * @param {number} workDaysPerWeek - Number of days worked per week (0-5)
 * @param {number} workHoursPerDay - Number of hours worked per day (kept for backwards compatibility, not used in calculation)
 * @param {number} fullTimeHours - Full-time hours per day (kept for backwards compatibility, not used in calculation)
 * @returns {number} Adjusted annual income
 */
export function calculateAdjustedIncome(annualIncome, workDaysPerWeek, workHoursPerDay, fullTimeHours = 7.6) {
  // Input validation
  if (typeof annualIncome !== 'number' || annualIncome < 0) {
    throw new Error('Annual income must be a non-negative number');
  }
  
  if (typeof workDaysPerWeek !== 'number' || workDaysPerWeek < 0 || workDaysPerWeek > 5) {
    throw new Error('Work days per week must be between 0 and 5');
  }
  
  if (typeof workHoursPerDay !== 'number' || workHoursPerDay < 0 || workHoursPerDay > 24) {
    throw new Error('Work hours per day must be between 0 and 24');
  }
  
  if (typeof fullTimeHours !== 'number' || fullTimeHours <= 0) {
    throw new Error('Full-time hours must be a positive number');
  }
  
  // Calculate adjusted income based on days worked only
  // This provides clean percentages: 1 day = 20%, 2 days = 40%, 3 days = 60%, 4 days = 80%, 5 days = 100%
  const daysFactor = workDaysPerWeek / 5;
  
  return annualIncome * daysFactor;
}

/**
 * Calculate combined household income from two parents
 * 
 * @param {number} parent1AdjustedIncome - Parent 1's adjusted income
 * @param {number} parent2AdjustedIncome - Parent 2's adjusted income (default: 0 for single parent)
 * @returns {number} Total household adjusted income
 */
export function calculateHouseholdIncome(parent1AdjustedIncome, parent2AdjustedIncome = 0) {
  // Input validation
  if (typeof parent1AdjustedIncome !== 'number' || parent1AdjustedIncome < 0) {
    throw new Error('Parent 1 adjusted income must be a non-negative number');
  }
  
  if (typeof parent2AdjustedIncome !== 'number' || parent2AdjustedIncome < 0) {
    throw new Error('Parent 2 adjusted income must be a non-negative number');
  }
  
  return parent1AdjustedIncome + parent2AdjustedIncome;
}

/**
 * Split combined household income between two parents
 * If ratio not provided, assumes 50/50 split
 * 
 * @param {number} combinedIncome - Total household income
 * @param {number} parent1Ratio - Ratio for parent 1 (0-1, default: 0.5 for 50/50 split)
 * @returns {Object} Object with parent1Income and parent2Income
 */
export function splitHouseholdIncome(combinedIncome, parent1Ratio = 0.5) {
  // Input validation
  if (typeof combinedIncome !== 'number' || combinedIncome < 0) {
    throw new Error('Combined income must be a non-negative number');
  }
  
  if (typeof parent1Ratio !== 'number' || parent1Ratio < 0 || parent1Ratio > 1) {
    throw new Error('Parent 1 ratio must be between 0 and 1');
  }
  
  return {
    parent1Income: combinedIncome * parent1Ratio,
    parent2Income: combinedIncome * (1 - parent1Ratio)
  };
}

/**
 * Validate income input values
 * 
 * @param {number} income - Income value to validate
 * @param {number} minIncome - Minimum acceptable income (default: 0)
 * @param {number} maxIncome - Maximum acceptable income (default: 10,000,000)
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateIncome(income, minIncome = 0, maxIncome = 10000000) {
  if (typeof income !== 'number' || isNaN(income)) {
    throw new Error('Income must be a valid number');
  }
  
  if (income < minIncome) {
    throw new Error(`Income must be at least ${minIncome}`);
  }
  
  if (income > maxIncome) {
    throw new Error(`Income must not exceed ${maxIncome}`);
  }
  
  return true;
}
