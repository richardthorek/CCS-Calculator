/**
 * Cost Calculation Module
 * Calculates childcare costs, subsidies, and out-of-pocket expenses
 * Based on 2025-26 CCS policy requirements
 */

import {
  CARE_TYPES,
  AGE_CATEGORIES,
  WORK_DEFAULTS,
  CHILDCARE_DEFAULTS,
  WITHHOLDING,
  getHourlyRateCap,
  getDailyRateCap
} from '../config/ccs-config.js';

/**
 * Apply withholding to subsidy amount
 * The government withholds a percentage of CCS to prevent overpayment debts
 * 
 * @param {number} subsidyAmount - Subsidy amount before withholding
 * @param {number} withholdingRate - Withholding percentage (0-100, default: 5)
 * @returns {Object} Breakdown of subsidy with withholding applied
 */
export function applyWithholding(subsidyAmount, withholdingRate = WITHHOLDING.DEFAULT_RATE) {
  if (typeof subsidyAmount !== 'number' || subsidyAmount < 0) {
    throw new Error('Subsidy amount must be a non-negative number');
  }
  
  if (typeof withholdingRate !== 'number' || withholdingRate < WITHHOLDING.MIN_RATE || withholdingRate > WITHHOLDING.MAX_RATE) {
    throw new Error(`Withholding rate must be between ${WITHHOLDING.MIN_RATE} and ${WITHHOLDING.MAX_RATE}`);
  }
  
  const withheldAmount = (withholdingRate / 100) * subsidyAmount;
  const paidSubsidy = subsidyAmount - withheldAmount;
  
  return {
    grossSubsidy: Math.round(subsidyAmount * 100) / 100,
    withheldAmount: Math.round(withheldAmount * 100) / 100,
    paidSubsidy: Math.round(paidSubsidy * 100) / 100,
    withholdingRate
  };
}

/**
 * Calculate effective daily rate (minimum of provider fee and rate cap)
 * 
 * @param {number} providerDailyFee - Provider's daily fee
 * @param {string} careType - Type of care (from CARE_TYPES)
 * @param {number} childAge - Age of child in years
 * @param {number} hoursPerDay - Hours charged per day (default: 10)
 * @returns {number} Effective daily rate
 */
export function calculateEffectiveDailyRate(providerDailyFee, careType, childAge, hoursPerDay = CHILDCARE_DEFAULTS.DEFAULT_HOURS_PER_DAY) {
  if (typeof providerDailyFee !== 'number' || providerDailyFee < 0) {
    throw new Error('Provider daily fee must be a non-negative number');
  }
  
  if (typeof childAge !== 'number' || childAge < 0 || childAge > 18) {
    throw new Error('Child age must be between 0 and 18');
  }
  
  if (typeof hoursPerDay !== 'number' || hoursPerDay <= 0) {
    throw new Error('Hours per day must be a positive number');
  }
  
  const rateCap = getDailyRateCap(careType, childAge, hoursPerDay);
  return Math.min(providerDailyFee, rateCap);
}

/**
 * Calculate subsidy per day for a child
 * 
 * @param {number} subsidyRate - CCS subsidy rate percentage (0-95)
 * @param {number} effectiveDailyRate - Effective daily rate after cap
 * @returns {number} Subsidy amount per day
 */
export function calculateSubsidyPerDay(subsidyRate, effectiveDailyRate) {
  if (typeof subsidyRate !== 'number' || subsidyRate < 0 || subsidyRate > 100) {
    throw new Error('Subsidy rate must be between 0 and 100');
  }
  
  if (typeof effectiveDailyRate !== 'number' || effectiveDailyRate < 0) {
    throw new Error('Effective daily rate must be a non-negative number');
  }
  
  return (subsidyRate / 100) * effectiveDailyRate;
}

/**
 * Calculate weekly subsidy, costs, and out-of-pocket amounts using daily rates
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.subsidyPerDay - Subsidy amount per day
 * @param {number} params.providerDailyFee - Provider's daily fee
 * @param {number} params.subsidisedDays - Number of subsidised days per week
 * @param {number} params.actualDays - Actual childcare days needed per week
 * @param {number} params.withholdingRate - Withholding percentage (default: 5)
 * @returns {Object} Weekly costs breakdown
 */
export function calculateWeeklyCostsFromDailyRate(params) {
  const { 
    subsidyPerDay, 
    providerDailyFee, 
    subsidisedDays, 
    actualDays,
    withholdingRate = WITHHOLDING.DEFAULT_RATE
  } = params;
  
  // Validation
  if (typeof subsidyPerDay !== 'number' || subsidyPerDay < 0) {
    throw new Error('Subsidy per day must be a non-negative number');
  }
  
  if (typeof providerDailyFee !== 'number' || providerDailyFee < 0) {
    throw new Error('Provider daily fee must be a non-negative number');
  }
  
  if (typeof subsidisedDays !== 'number' || subsidisedDays < 0 || subsidisedDays > 7) {
    throw new Error('Subsidised days must be between 0 and 7');
  }
  
  if (typeof actualDays !== 'number' || actualDays < 0 || actualDays > 7) {
    throw new Error('Actual days must be between 0 and 7');
  }
  
  // Calculate costs
  const daysWithSubsidy = Math.min(subsidisedDays, actualDays);
  const daysWithoutSubsidy = Math.max(0, actualDays - subsidisedDays);
  
  const weeklyGrossSubsidy = subsidyPerDay * daysWithSubsidy;
  const withholding = applyWithholding(weeklyGrossSubsidy, withholdingRate);
  
  const weeklyFullCost = providerDailyFee * actualDays;
  const weeklyOutOfPocket = weeklyFullCost - withholding.paidSubsidy;
  
  return {
    weeklySubsidy: withholding.paidSubsidy,
    weeklyGrossSubsidy: withholding.grossSubsidy,
    weeklyWithheld: withholding.withheldAmount,
    weeklyFullCost: Math.round(weeklyFullCost * 100) / 100,
    weeklyOutOfPocket: Math.round(weeklyOutOfPocket * 100) / 100,
    daysWithSubsidy,
    daysWithoutSubsidy,
    withholdingRate
  };
}

/**
 * Calculate effective hourly rate (minimum of provider fee and rate cap)
 * 
 * @param {number} providerFee - Provider's hourly fee
 * @param {string} careType - Type of care (from CARE_TYPES)
 * @param {number} childAge - Age of child in years
 * @returns {number} Effective hourly rate
 */
export function calculateEffectiveHourlyRate(providerFee, careType, childAge) {
  if (typeof providerFee !== 'number' || providerFee < 0) {
    throw new Error('Provider fee must be a non-negative number');
  }
  
  if (typeof childAge !== 'number' || childAge < 0 || childAge > 18) {
    throw new Error('Child age must be between 0 and 18');
  }
  
  const rateCap = getHourlyRateCap(careType, childAge);
  return Math.min(providerFee, rateCap);
}

/**
 * Calculate subsidy per hour for a child
 * 
 * @param {number} subsidyRate - CCS subsidy rate percentage (0-95)
 * @param {number} effectiveHourlyRate - Effective hourly rate after cap
 * @returns {number} Subsidy amount per hour
 */
export function calculateSubsidyPerHour(subsidyRate, effectiveHourlyRate) {
  if (typeof subsidyRate !== 'number' || subsidyRate < 0 || subsidyRate > 100) {
    throw new Error('Subsidy rate must be between 0 and 100');
  }
  
  if (typeof effectiveHourlyRate !== 'number' || effectiveHourlyRate < 0) {
    throw new Error('Effective hourly rate must be a non-negative number');
  }
  
  return (subsidyRate / 100) * effectiveHourlyRate;
}

/**
 * Calculate weekly subsidy, costs, and out-of-pocket amounts
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.subsidyPerHour - Subsidy amount per hour
 * @param {number} params.providerFee - Provider's hourly fee
 * @param {number} params.subsidisedHours - Number of subsidised hours per week
 * @param {number} params.actualHours - Actual childcare hours needed per week
 * @param {number} params.withholdingRate - Withholding percentage (default: 5)
 * @returns {Object} Weekly costs breakdown
 */
export function calculateWeeklyCosts(params) {
  const { 
    subsidyPerHour, 
    providerFee, 
    subsidisedHours, 
    actualHours,
    withholdingRate = WITHHOLDING.DEFAULT_RATE
  } = params;
  
  // Validation
  if (typeof subsidyPerHour !== 'number' || subsidyPerHour < 0) {
    throw new Error('Subsidy per hour must be a non-negative number');
  }
  
  if (typeof providerFee !== 'number' || providerFee < 0) {
    throw new Error('Provider fee must be a non-negative number');
  }
  
  if (typeof subsidisedHours !== 'number' || subsidisedHours < 0) {
    throw new Error('Subsidised hours must be a non-negative number');
  }
  
  if (typeof actualHours !== 'number' || actualHours < 0) {
    throw new Error('Actual hours must be a non-negative number');
  }
  
  // Calculate costs
  const hoursWithSubsidy = Math.min(subsidisedHours, actualHours);
  const hoursWithoutSubsidy = Math.max(0, actualHours - subsidisedHours);
  
  const weeklyGrossSubsidy = subsidyPerHour * hoursWithSubsidy;
  const withholding = applyWithholding(weeklyGrossSubsidy, withholdingRate);
  
  const weeklyFullCost = providerFee * actualHours;
  const weeklyOutOfPocket = weeklyFullCost - withholding.paidSubsidy;
  
  return {
    weeklySubsidy: withholding.paidSubsidy,
    weeklyGrossSubsidy: withholding.grossSubsidy,
    weeklyWithheld: withholding.withheldAmount,
    weeklyFullCost: Math.round(weeklyFullCost * 100) / 100,
    weeklyOutOfPocket: Math.round(weeklyOutOfPocket * 100) / 100,
    hoursWithSubsidy,
    hoursWithoutSubsidy,
    withholdingRate
  };
}

/**
 * Calculate annual costs from weekly costs
 * 
 * @param {number} weeklyCost - Weekly cost amount
 * @param {number} weeksPerYear - Weeks per year (default: 52)
 * @returns {number} Annual cost
 */
export function calculateAnnualCost(weeklyCost, weeksPerYear = WORK_DEFAULTS.WEEKS_PER_YEAR) {
  if (typeof weeklyCost !== 'number' || weeklyCost < 0) {
    throw new Error('Weekly cost must be a non-negative number');
  }
  
  if (typeof weeksPerYear !== 'number' || weeksPerYear <= 0) {
    throw new Error('Weeks per year must be a positive number');
  }
  
  return Math.round(weeklyCost * weeksPerYear * 100) / 100;
}

/**
 * Calculate net annual income after childcare costs
 * 
 * @param {number} householdIncome - Adjusted household income
 * @param {number} annualChildcareCost - Total annual childcare out-of-pocket cost
 * @returns {number} Net annual income after childcare
 */
export function calculateNetIncome(householdIncome, annualChildcareCost) {
  if (typeof householdIncome !== 'number' || householdIncome < 0) {
    throw new Error('Household income must be a non-negative number');
  }
  
  if (typeof annualChildcareCost !== 'number' || annualChildcareCost < 0) {
    throw new Error('Annual childcare cost must be a non-negative number');
  }
  
  return Math.max(0, householdIncome - annualChildcareCost);
}

/**
 * Calculate childcare cost as percentage of income
 * 
 * @param {number} annualChildcareCost - Total annual childcare out-of-pocket cost
 * @param {number} householdIncome - Adjusted household income
 * @returns {number} Percentage of income spent on childcare
 */
export function calculateCostAsPercentageOfIncome(annualChildcareCost, householdIncome) {
  if (typeof annualChildcareCost !== 'number' || annualChildcareCost < 0) {
    throw new Error('Annual childcare cost must be a non-negative number');
  }
  
  if (typeof householdIncome !== 'number' || householdIncome < 0) {
    throw new Error('Household income must be a non-negative number');
  }
  
  if (householdIncome === 0) {
    return 0; // Avoid division by zero
  }
  
  const percentage = (annualChildcareCost / householdIncome) * 100;
  return Math.round(percentage * 100) / 100;
}

/**
 * Calculate complete cost breakdown for a family
 * This is a convenience function that combines all calculations
 * 
 * @param {Object} params - Complete calculation parameters
 * @returns {Object} Complete cost breakdown
 */
export function calculateCompleteCostBreakdown(params) {
  const {
    householdIncome,
    subsidyRate,
    providerFee,
    careType,
    childAge,
    subsidisedHours,
    actualHours,
    withholdingRate = WITHHOLDING.DEFAULT_RATE
  } = params;
  
  // Calculate effective hourly rate
  const effectiveHourlyRate = calculateEffectiveHourlyRate(providerFee, careType, childAge);
  
  // Calculate subsidy per hour
  const subsidyPerHour = calculateSubsidyPerHour(subsidyRate, effectiveHourlyRate);
  
  // Calculate weekly costs (including withholding)
  const weeklyCosts = calculateWeeklyCosts({
    subsidyPerHour,
    providerFee,
    subsidisedHours,
    actualHours,
    withholdingRate
  });
  
  // Calculate annual costs
  const annualSubsidy = calculateAnnualCost(weeklyCosts.weeklySubsidy);
  const annualGrossSubsidy = calculateAnnualCost(weeklyCosts.weeklyGrossSubsidy);
  const annualWithheld = calculateAnnualCost(weeklyCosts.weeklyWithheld);
  const annualFullCost = calculateAnnualCost(weeklyCosts.weeklyFullCost);
  const annualOutOfPocket = calculateAnnualCost(weeklyCosts.weeklyOutOfPocket);
  
  // Calculate net income and cost percentage
  const netIncome = calculateNetIncome(householdIncome, annualOutOfPocket);
  const costPercentage = calculateCostAsPercentageOfIncome(annualOutOfPocket, householdIncome);
  
  return {
    effectiveHourlyRate,
    subsidyPerHour,
    weekly: weeklyCosts,
    annual: {
      subsidy: annualSubsidy,
      grossSubsidy: annualGrossSubsidy,
      withheld: annualWithheld,
      fullCost: annualFullCost,
      outOfPocket: annualOutOfPocket
    },
    netIncome,
    costPercentage,
    withholdingRate
  };
}

// Export care types and withholding for convenience
export { CARE_TYPES, AGE_CATEGORIES, WITHHOLDING };
