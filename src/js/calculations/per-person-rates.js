/**
 * Per-Person Effective Rate Calculations
 * 
 * Calculates the effective daily, weekly, monthly, and annual childcare rates
 * if one parent paid for all childcare from their salary alone.
 * This helps families understand the impact of childcare costs on each parent's income.
 */

import { HIGHER_RATE_THRESHOLDS } from '../config/ccs-config.js';

/**
 * Calculate effective rates per person
 * 
 * @param {number} parent1Income - Parent 1's annual income
 * @param {number} parent2Income - Parent 2's annual income
 * @param {number} annualOutOfPocket - Total annual out-of-pocket childcare cost
 * @returns {Object} Per-person rate information
 */
export function calculatePerPersonRates(parent1Income, parent2Income, annualOutOfPocket) {
  const weeklyOutOfPocket = annualOutOfPocket / 52;
  const monthlyOutOfPocket = annualOutOfPocket / 12;
  const dailyOutOfPocket = weeklyOutOfPocket / 5; // Assuming 5-day work week
  
  // Calculate what percentage of each parent's income childcare represents
  const parent1Percentage = parent1Income > 0 ? (annualOutOfPocket / parent1Income) * 100 : 0;
  const parent2Percentage = parent2Income > 0 ? (annualOutOfPocket / parent2Income) * 100 : 0;
  
  // Calculate effective daily rates (what it "costs" per day if paid from their salary)
  const parent1DailyRate = parent1Income > 0 ? dailyOutOfPocket : 0;
  const parent2DailyRate = parent2Income > 0 ? dailyOutOfPocket : 0;
  
  // Calculate effective weekly rates
  const parent1WeeklyRate = parent1Income > 0 ? weeklyOutOfPocket : 0;
  const parent2WeeklyRate = parent2Income > 0 ? weeklyOutOfPocket : 0;
  
  // Calculate effective monthly rates
  const parent1MonthlyRate = parent1Income > 0 ? monthlyOutOfPocket : 0;
  const parent2MonthlyRate = parent2Income > 0 ? monthlyOutOfPocket : 0;
  
  // Calculate effective annual rates
  const parent1AnnualRate = parent1Income > 0 ? annualOutOfPocket : 0;
  const parent2AnnualRate = parent2Income > 0 ? annualOutOfPocket : 0;
  
  // Calculate net income after childcare
  const parent1NetIncome = parent1Income > 0 ? parent1Income - annualOutOfPocket : 0;
  const parent2NetIncome = parent2Income > 0 ? parent2Income - annualOutOfPocket : 0;
  
  return {
    parent1: {
      dailyRate: parent1DailyRate,
      weeklyRate: parent1WeeklyRate,
      monthlyRate: parent1MonthlyRate,
      annualRate: parent1AnnualRate,
      percentage: parent1Percentage,
      netIncome: parent1NetIncome,
      income: parent1Income
    },
    parent2: {
      dailyRate: parent2DailyRate,
      weeklyRate: parent2WeeklyRate,
      monthlyRate: parent2MonthlyRate,
      annualRate: parent2AnnualRate,
      percentage: parent2Percentage,
      netIncome: parent2NetIncome,
      income: parent2Income
    },
    shared: {
      dailyRate: dailyOutOfPocket,
      weeklyRate: weeklyOutOfPocket,
      monthlyRate: monthlyOutOfPocket,
      annualRate: annualOutOfPocket
    }
  };
}

/**
 * Check if household income is near critical thresholds
 * 
 * The $357,563-$367,562 range is critical because:
 * - Below $357,563: Second+ children get 80% subsidy (tapering down from Band 3)
 * - $357,563-$367,562: Second+ children get flat 50% subsidy
 * - Above $367,562: Second+ children revert to standard rate (much lower)
 * 
 * @param {number} householdIncome - Total household income
 * @param {boolean} hasMultipleChildrenUnder5 - True if family has 2+ children aged ≤5
 * @returns {Object} Threshold warning information
 */
export function checkThresholdRisk(householdIncome, hasMultipleChildrenUnder5) {
  const LOWER_THRESHOLD = HIGHER_RATE_THRESHOLDS.BAND4_START; // $357,563
  const UPPER_THRESHOLD = HIGHER_RATE_THRESHOLDS.REVERT_TO_STANDARD; // $367,563
  const WARNING_RANGE = 10000; // Warn if within $10k of threshold
  
  let riskLevel = 'none';
  let message = '';
  let detail = '';
  let thresholdAmount = 0;
  let distanceFromThreshold = 0;
  
  // Only relevant for families with multiple children aged ≤5
  if (!hasMultipleChildrenUnder5) {
    return {
      riskLevel,
      message,
      detail,
      thresholdAmount,
      distanceFromThreshold,
      showWarning: false
    };
  }
  
  // Check proximity to lower threshold ($357,563)
  if (householdIncome < LOWER_THRESHOLD && householdIncome >= LOWER_THRESHOLD - WARNING_RANGE) {
    riskLevel = 'low';
    distanceFromThreshold = LOWER_THRESHOLD - householdIncome;
    thresholdAmount = LOWER_THRESHOLD;
    message = `Approaching $357,563 threshold`;
    detail = `Your income is $${distanceFromThreshold.toLocaleString()} below the threshold. ` +
             `Above this amount, younger children receive a flat 50% subsidy instead of the current higher rate.`;
  }
  
  // Check if in the sweet spot ($357,563-$367,562)
  if (householdIncome >= LOWER_THRESHOLD && householdIncome < UPPER_THRESHOLD) {
    riskLevel = 'medium';
    distanceFromThreshold = UPPER_THRESHOLD - householdIncome;
    thresholdAmount = UPPER_THRESHOLD;
    message = `In the 50% subsidy zone`;
    detail = `Younger children receive a flat 50% subsidy. Be cautious: earning $${distanceFromThreshold.toLocaleString()} more ` +
             `will push you over $${UPPER_THRESHOLD.toLocaleString()}, dropping subsidy to the standard rate (likely much lower).`;
  }
  
  // Check if just over the upper threshold
  if (householdIncome >= UPPER_THRESHOLD && householdIncome < UPPER_THRESHOLD + WARNING_RANGE) {
    riskLevel = 'high';
    distanceFromThreshold = householdIncome - UPPER_THRESHOLD;
    thresholdAmount = UPPER_THRESHOLD;
    message = `Just crossed the $367,563 threshold`;
    detail = `You're $${distanceFromThreshold.toLocaleString()} over the threshold. ` +
             `Younger children now use the standard rate instead of 50%. ` +
             `Consider if earning slightly less (via salary sacrifice, etc.) could increase your net position.`;
  }
  
  const showWarning = riskLevel !== 'none';
  
  return {
    riskLevel,
    message,
    detail,
    thresholdAmount,
    distanceFromThreshold,
    showWarning
  };
}

/**
 * Calculate the marginal impact of earning additional income
 * Shows how much of each extra dollar earned is lost to reduced subsidy
 * 
 * @param {number} currentIncome - Current household income
 * @param {number} currentSubsidy - Current annual subsidy amount
 * @param {number} incomeIncrease - Amount of income increase to test (default: $1000)
 * @returns {Object} Marginal impact analysis
 */
export function calculateMarginalImpact(currentIncome, currentSubsidy, incomeIncrease = 1000) {
  // This is a simplified version - actual calculation would need to recalculate
  // subsidy rates at the new income level
  // For now, return structure for future enhancement
  
  return {
    incomeIncrease,
    estimatedSubsidyReduction: 0,
    netBenefit: incomeIncrease,
    effectiveMargin: 100 // Percentage of extra income actually kept
  };
}
