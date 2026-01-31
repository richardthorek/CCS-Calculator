/**
 * Parent Schedule Calculation Module
 * Calculates minimum childcare days based on parent work schedules
 * Determines which specific days childcare is needed
 */

import { DAYS_OF_WEEK, DAYS_OF_WEEK_LABELS } from '../config/ccs-config.js';

/**
 * Calculate minimum childcare days needed based on parent work schedules
 * Key insight: Childcare is only needed on days when BOTH parents are working.
 * If either parent is home on a given day, they can care for the children.
 * 
 * @param {Array<string>} parent1Days - Array of days parent 1 works (e.g., ['monday', 'tuesday', 'wednesday'])
 * @param {Array<string>} parent2Days - Array of days parent 2 works (empty array if single parent)
 * @returns {Object} Result with childcareDays array and breakdown
 */
export function calculateMinimumChildcareDays(parent1Days = [], parent2Days = []) {
  // Validation
  if (!Array.isArray(parent1Days)) {
    throw new Error('Parent 1 days must be an array');
  }
  
  if (!Array.isArray(parent2Days)) {
    throw new Error('Parent 2 days must be an array');
  }
  
  // Single parent or parent 2 not working - need care on all parent 1 work days
  if (parent2Days.length === 0) {
    return {
      childcareDays: [...parent1Days],
      daysCount: parent1Days.length,
      parent1WorkDays: parent1Days,
      parent2WorkDays: [],
      overlappingDays: [],
      parent1OnlyDays: parent1Days,
      parent2OnlyDays: [],
      daysWithoutCare: getDaysWithoutCare(parent1Days, []),
      explanation: generateExplanation(parent1Days, [], parent1Days)
    };
  }
  
  // Two parents: childcare needed only when BOTH parents are working
  // Intersection of both parents' work days (days when neither parent is home)
  const childcareDays = parent1Days.filter(day => parent2Days.includes(day)).sort((a, b) => {
    const order = Object.values(DAYS_OF_WEEK);
    return order.indexOf(a) - order.indexOf(b);
  });
  
  // Calculate overlapping days (both parents working) - same as childcare days
  const overlappingDays = [...childcareDays];
  
  // Calculate days only one parent works (a parent is home, so no childcare needed)
  const parent1OnlyDays = parent1Days.filter(day => !parent2Days.includes(day));
  const parent2OnlyDays = parent2Days.filter(day => !parent1Days.includes(day));
  
  // Days without care: days where at least one parent is home (not working)
  // This includes: days neither parent works + days only one parent works
  const allWorkDays = [...new Set([...parent1Days, ...parent2Days])];
  const daysWithoutCare = getDaysWithoutCare(childcareDays, []); // All non-childcare days
  
  return {
    childcareDays,
    daysCount: childcareDays.length,
    parent1WorkDays: parent1Days,
    parent2WorkDays: parent2Days,
    overlappingDays,
    parent1OnlyDays,
    parent2OnlyDays,
    daysWithoutCare,
    explanation: generateExplanation(parent1Days, parent2Days, childcareDays)
  };
}

/**
 * Get days of the week without childcare needed
 * For single parent: days not working
 * For two parents: days when at least one parent is home (not in the childcare days)
 * @param {Array<string>} childcareDays - Days when childcare is needed (for two parents, this is the intersection)
 * @param {Array<string>} _unused - Kept for backwards compatibility
 * @returns {Array<string>} Days without care needed
 */
function getDaysWithoutCare(childcareDays, _unused = []) {
  const allWeekDays = Object.values(DAYS_OF_WEEK);
  return allWeekDays.filter(day => !childcareDays.includes(day));
}

/**
 * Generate human-readable explanation of the schedule
 * @param {Array<string>} parent1Days - Parent 1 work days
 * @param {Array<string>} parent2Days - Parent 2 work days
 * @param {Array<string>} childcareDays - Days childcare is needed
 * @returns {string} Explanation
 */
function generateExplanation(parent1Days, parent2Days, childcareDays) {
  const formatDays = (days) => days.map(d => DAYS_OF_WEEK_LABELS[d]).join(', ');
  
  if (parent2Days.length === 0) {
    return `Single parent working ${formatDays(parent1Days)}. Childcare needed on all work days.`;
  }
  
  const p1DaysStr = formatDays(parent1Days);
  const p2DaysStr = formatDays(parent2Days);
  const careDaysStr = formatDays(childcareDays);
  
  return `Parent 1: ${p1DaysStr}. Parent 2: ${p2DaysStr}. Childcare needed: ${careDaysStr}.`;
}

/**
 * Convert days count to day array for backward compatibility
 * Defaults to consecutive days starting from Monday
 * @param {number} daysCount - Number of days (1-5)
 * @returns {Array<string>} Array of day names
 */
export function convertDaysCountToDayArray(daysCount) {
  if (typeof daysCount !== 'number' || daysCount < 0 || daysCount > 5) {
    throw new Error('Days count must be between 0 and 5');
  }
  
  const allDays = Object.values(DAYS_OF_WEEK);
  return allDays.slice(0, daysCount);
}

/**
 * Calculate childcare cost savings from parent availability
 * @param {number} totalDays - Total possible childcare days (5)
 * @param {number} childcareDays - Actual childcare days needed
 * @param {number} dailyRate - Daily rate charged
 * @returns {Object} Savings information
 */
export function calculateCostSavings(totalDays, childcareDays, dailyRate) {
  if (typeof totalDays !== 'number' || totalDays < 0) {
    throw new Error('Total days must be a non-negative number');
  }
  
  if (typeof childcareDays !== 'number' || childcareDays < 0) {
    throw new Error('Childcare days must be a non-negative number');
  }
  
  if (typeof dailyRate !== 'number' || dailyRate < 0) {
    throw new Error('Daily rate must be a non-negative number');
  }
  
  const daysWithoutCare = totalDays - childcareDays;
  const weeklySavings = daysWithoutCare * dailyRate;
  const annualSavings = weeklySavings * 52;
  
  return {
    daysWithoutCare,
    weeklySavings: Math.round(weeklySavings * 100) / 100,
    annualSavings: Math.round(annualSavings * 100) / 100,
    percentageSaved: totalDays > 0 ? Math.round((daysWithoutCare / totalDays) * 100) : 0
  };
}

/**
 * Format schedule breakdown for display
 * @param {Object} scheduleResult - Result from calculateMinimumChildcareDays
 * @returns {Object} Formatted breakdown for UI display
 */
export function formatScheduleBreakdown(scheduleResult) {
  const formatDayList = (days) => {
    if (days.length === 0) return 'None';
    return days.map(d => DAYS_OF_WEEK_LABELS[d]).join(', ');
  };
  
  return {
    parent1Days: formatDayList(scheduleResult.parent1WorkDays),
    parent2Days: formatDayList(scheduleResult.parent2WorkDays),
    childcareDays: formatDayList(scheduleResult.childcareDays),
    daysWithoutCare: formatDayList(scheduleResult.daysWithoutCare),
    overlappingDays: formatDayList(scheduleResult.overlappingDays),
    parent1OnlyDays: formatDayList(scheduleResult.parent1OnlyDays),
    parent2OnlyDays: formatDayList(scheduleResult.parent2OnlyDays),
    explanation: scheduleResult.explanation
  };
}
