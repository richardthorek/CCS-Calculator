/**
 * CCS Configuration - 2025-26 Financial Year
 * 
 * This file contains all the rates, thresholds, and constants used in CCS calculations.
 * Update this file when new financial year rates are published.
 * 
 * Last updated: 2025-26 Financial Year
 * Source: Australian Government Department of Education
 */

/**
 * Income thresholds for standard CCS rate (eldest child aged ≤5)
 */
export const STANDARD_RATE_THRESHOLDS = {
  // Maximum income for 90% subsidy
  MAX_90_PERCENT: 85279,
  
  // Taper range start (income above which subsidy starts decreasing)
  TAPER_START: 85280,
  
  // Taper range end (last income level with subsidy)
  TAPER_END: 535278,
  
  // Minimum income for 0% subsidy
  MIN_ZERO_PERCENT: 535279,
  
  // Rate decrease parameters
  TAPER_RATE_INCOME_INCREMENT: 5000,  // Subsidy decreases for each $5,000 of income
  TAPER_RATE_PERCENTAGE_DECREASE: 1   // Decreases by 1% per increment
};

/**
 * Income thresholds for higher CCS rate (second and younger children aged ≤5)
 */
export const HIGHER_RATE_THRESHOLDS = {
  // Band 1: 95% subsidy
  MAX_95_PERCENT: 143273,
  BAND1_START: 143274,
  BAND1_END: 188272,
  
  // Band 2: 80% flat subsidy
  BAND2_START: 188273,
  BAND2_END: 267562,
  
  // Band 3: Taper from 80% to 50%
  BAND3_START: 267563,
  BAND3_END: 357562,
  
  // Band 4: 50% flat subsidy
  BAND4_START: 357563,
  BAND4_END: 367562,
  
  // Revert to standard rate threshold
  REVERT_TO_STANDARD: 367563,
  
  // Rate decrease parameters
  TAPER_RATE_INCOME_INCREMENT: 3000,  // Subsidy decreases for each $3,000 of income
  TAPER_RATE_PERCENTAGE_DECREASE: 1   // Decreases by 1% per increment
};

/**
 * Activity test thresholds for subsidised hours
 */
export const ACTIVITY_TEST = {
  // Base subsidy hours (minimum for all families)
  BASE_HOURS_PER_FORTNIGHT: 72,
  BASE_HOURS_PER_WEEK: 36,
  
  // Higher subsidy hours (for higher activity families)
  HIGHER_HOURS_PER_FORTNIGHT: 100,
  HIGHER_HOURS_PER_WEEK: 50,
  
  // Threshold for higher hours (lower-activity parent must work more than this)
  HIGHER_ACTIVITY_THRESHOLD: 48  // hours per fortnight
};

/**
 * Hourly rate caps by care type and child age
 * Amounts are in AUD per hour
 */
export const HOURLY_RATE_CAPS = {
  // Centre-Based Day Care
  CENTRE_BASED: {
    SCHOOL_AGE: 12.81,      // Children of school age
    NON_SCHOOL_AGE: 14.63   // Children not yet school age
  },
  
  // Outside School Hours Care (OSHC)
  OSHC: {
    SCHOOL_AGE: 12.81,
    NON_SCHOOL_AGE: 14.63
  },
  
  // Family Day Care
  FAMILY_DAY_CARE: {
    SCHOOL_AGE: 13.56,
    NON_SCHOOL_AGE: 13.56
  },
  
  // In-Home Care (per family, not per child)
  IN_HOME_CARE: {
    SCHOOL_AGE: 39.80,
    NON_SCHOOL_AGE: 39.80,
    IS_PER_FAMILY: true  // Flag to indicate this rate is per family
  }
};

/**
 * Care type constants for consistent identification
 */
export const CARE_TYPES = {
  CENTRE_BASED: 'centre-based',
  OSHC: 'oshc',
  FAMILY_DAY_CARE: 'family-day-care',
  IN_HOME_CARE: 'in-home-care'
};

/**
 * Child age categories for rate cap determination
 */
export const AGE_CATEGORIES = {
  SCHOOL_AGE_THRESHOLD: 6,  // Children 6+ are considered school age
  HIGHER_RATE_AGE_THRESHOLD: 5  // Children ≤5 may qualify for higher subsidy rate
};

/**
 * Work and income calculation defaults
 */
export const WORK_DEFAULTS = {
  FULL_TIME_HOURS_PER_DAY: 7.6,  // Standard full-time hours per day
  FULL_TIME_DAYS_PER_WEEK: 5,    // Standard full-time days per week
  MAX_WORK_DAYS_PER_WEEK: 5,     // Maximum days per week for CCS calculations
  WEEKS_PER_FORTNIGHT: 2,
  WEEKS_PER_YEAR: 52
};

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  MIN_INCOME: 0,
  MAX_INCOME: 10000000,
  MIN_AGE: 0,
  MAX_AGE: 18,
  MIN_HOURS_PER_DAY: 0,
  MAX_HOURS_PER_DAY: 24,
  MIN_DAYS_PER_WEEK: 0,
  MAX_DAYS_PER_WEEK: 7
};

/**
 * Financial year information
 */
export const FINANCIAL_YEAR = {
  YEAR: '2025-26',
  START_DATE: '2025-07-01',
  END_DATE: '2026-06-30',
  LAST_UPDATED: '2026-01-31'
};

/**
 * Helper function to get hourly rate cap for a specific care type and age
 * 
 * @param {string} careType - Type of care (use CARE_TYPES constants)
 * @param {number} childAge - Age of the child in years
 * @returns {number} Hourly rate cap in AUD
 */
export function getHourlyRateCap(careType, childAge) {
  const isSchoolAge = childAge >= AGE_CATEGORIES.SCHOOL_AGE_THRESHOLD;
  const ageCategory = isSchoolAge ? 'SCHOOL_AGE' : 'NON_SCHOOL_AGE';
  
  switch (careType) {
    case CARE_TYPES.CENTRE_BASED:
      return HOURLY_RATE_CAPS.CENTRE_BASED[ageCategory];
    case CARE_TYPES.OSHC:
      return HOURLY_RATE_CAPS.OSHC[ageCategory];
    case CARE_TYPES.FAMILY_DAY_CARE:
      return HOURLY_RATE_CAPS.FAMILY_DAY_CARE[ageCategory];
    case CARE_TYPES.IN_HOME_CARE:
      return HOURLY_RATE_CAPS.IN_HOME_CARE[ageCategory];
    default:
      throw new Error(`Invalid care type: ${careType}`);
  }
}

/**
 * Export all configuration as a single object for easy access
 */
export const CCS_CONFIG = {
  STANDARD_RATE_THRESHOLDS,
  HIGHER_RATE_THRESHOLDS,
  ACTIVITY_TEST,
  HOURLY_RATE_CAPS,
  CARE_TYPES,
  AGE_CATEGORIES,
  WORK_DEFAULTS,
  VALIDATION_LIMITS,
  FINANCIAL_YEAR,
  getHourlyRateCap
};

export default CCS_CONFIG;
