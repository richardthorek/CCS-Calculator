/**
 * Subsidy Rate Calculation Module
 * Calculates CCS percentage based on household income and child details
 * Based on 2025-26 CCS policy requirements
 */

import {
  STANDARD_RATE_THRESHOLDS,
  HIGHER_RATE_THRESHOLDS
} from '../config/ccs-config.js';

/**
 * Calculate standard CCS rate for eldest child aged ≤5
 * 
 * @param {number} householdIncome - Adjusted household income
 * @returns {number} CCS percentage (0-90)
 */
export function calculateStandardRate(householdIncome) {
  if (typeof householdIncome !== 'number' || householdIncome < 0) {
    throw new Error('Household income must be a non-negative number');
  }

  // Income ≤ $85,279 → 90%
  if (householdIncome <= STANDARD_RATE_THRESHOLDS.MAX_90_PERCENT) {
    return 90;
  }

  // ≥ $535,279 → 0%
  if (householdIncome >= STANDARD_RATE_THRESHOLDS.MIN_ZERO_PERCENT) {
    return 0;
  }

  // $85,280–$535,278 → Decreases by 1% per $5,000
  // Rate drops by 1% for each complete $5,000 bracket
  // $85,280-$90,279 = 89% (bracket 0)
  // $90,280-$95,279 = 88% (bracket 1)
  const incomeAboveStart = householdIncome - STANDARD_RATE_THRESHOLDS.TAPER_START;
  const bracketNumber = Math.floor(incomeAboveStart / STANDARD_RATE_THRESHOLDS.TAPER_RATE_INCOME_INCREMENT);
  const percentageDecrease = (bracketNumber + 1) * STANDARD_RATE_THRESHOLDS.TAPER_RATE_PERCENTAGE_DECREASE;
  
  const subsidyRate = 90 - percentageDecrease;
  
  // Ensure rate doesn't go below 0
  return Math.max(0, subsidyRate);
}

/**
 * Calculate higher CCS rate for second and younger children aged ≤5
 * 
 * @param {number} householdIncome - Adjusted household income
 * @returns {number} CCS percentage (0-95)
 */
export function calculateHigherRate(householdIncome) {
  if (typeof householdIncome !== 'number' || householdIncome < 0) {
    throw new Error('Household income must be a non-negative number');
  }

  // Income ≤ $143,273 → 95%
  if (householdIncome <= HIGHER_RATE_THRESHOLDS.MAX_95_PERCENT) {
    return 95;
  }

  // $143,274–$188,272 → Decreases by 1% per $3,000 from 95%
  if (householdIncome <= HIGHER_RATE_THRESHOLDS.BAND1_END) {
    const incomeAboveStart = householdIncome - HIGHER_RATE_THRESHOLDS.BAND1_START;
    const bracketNumber = Math.floor(incomeAboveStart / HIGHER_RATE_THRESHOLDS.TAPER_RATE_INCOME_INCREMENT);
    const percentageDecrease = (bracketNumber + 1) * HIGHER_RATE_THRESHOLDS.TAPER_RATE_PERCENTAGE_DECREASE;
    return Math.max(80, 95 - percentageDecrease);
  }

  // $188,273–$267,562 → 80%
  if (householdIncome <= HIGHER_RATE_THRESHOLDS.BAND2_END) {
    return 80;
  }

  // $267,563–$357,562 → Decreases by 1% per $3,000 from 80%
  if (householdIncome <= HIGHER_RATE_THRESHOLDS.BAND3_END) {
    const incomeAboveStart = householdIncome - HIGHER_RATE_THRESHOLDS.BAND3_START;
    const bracketNumber = Math.floor(incomeAboveStart / HIGHER_RATE_THRESHOLDS.TAPER_RATE_INCOME_INCREMENT);
    const percentageDecrease = (bracketNumber + 1) * HIGHER_RATE_THRESHOLDS.TAPER_RATE_PERCENTAGE_DECREASE;
    return Math.max(50, 80 - percentageDecrease);
  }

  // $357,563–$367,562 → 50%
  if (householdIncome <= HIGHER_RATE_THRESHOLDS.BAND4_END) {
    return 50;
  }

  // ≥ $367,563 → Reverts to standard CCS rate
  return calculateStandardRate(householdIncome);
}

/**
 * Calculate CCS rate for a specific child based on household income and child position
 * 
 * @param {number} householdIncome - Adjusted household income
 * @param {number} childAge - Age of the child in years
 * @param {number} childPosition - Position of child (1 for eldest, 2+ for younger siblings)
 * @returns {number} CCS percentage for this child
 */
export function calculateChildSubsidyRate(householdIncome, childAge, childPosition = 1) {
  if (typeof householdIncome !== 'number' || householdIncome < 0) {
    throw new Error('Household income must be a non-negative number');
  }

  if (typeof childAge !== 'number' || childAge < 0 || childAge > 18) {
    throw new Error('Child age must be between 0 and 18');
  }

  if (typeof childPosition !== 'number' || childPosition < 1) {
    throw new Error('Child position must be at least 1');
  }

  // Children over 5 use standard rate
  if (childAge > 5) {
    return calculateStandardRate(householdIncome);
  }

  // First child aged ≤5 uses standard rate
  if (childPosition === 1) {
    return calculateStandardRate(householdIncome);
  }

  // Second and younger children aged ≤5 use higher rate
  return calculateHigherRate(householdIncome);
}

/**
 * Calculate subsidy rates for multiple children
 * 
 * @param {number} householdIncome - Adjusted household income
 * @param {Array<Object>} children - Array of child objects with {age, position} or just {age}
 * @returns {Array<Object>} Array of subsidy rates with child details
 */
export function calculateMultipleChildrenRates(householdIncome, children) {
  if (typeof householdIncome !== 'number' || householdIncome < 0) {
    throw new Error('Household income must be a non-negative number');
  }

  if (!Array.isArray(children) || children.length === 0) {
    throw new Error('Children must be a non-empty array');
  }

  // Sort children by age to determine positions (oldest first)
  const sortedChildren = [...children].sort((a, b) => b.age - a.age);

  return sortedChildren.map((child, index) => {
    const position = child.position !== undefined ? child.position : index + 1;
    const subsidyRate = calculateChildSubsidyRate(householdIncome, child.age, position);
    
    return {
      age: child.age,
      position,
      subsidyRate,
      isEldest: position === 1,
      usesHigherRate: child.age <= 5 && position > 1
    };
  });
}

// Export constants for testing and reference
export const SUBSIDY_CONSTANTS = {
  STANDARD_RATE_THRESHOLDS,
  HIGHER_RATE_THRESHOLDS
};
