/**
 * Activity Test & Subsidised Hours Calculation Module
 * Calculates subsidised childcare hours based on parent work activity
 * Based on 2025-26 CCS policy requirements
 */

import { ACTIVITY_TEST } from '../config/ccs-config.js';

// Re-export for backward compatibility
const ACTIVITY_TEST_CONSTANTS = ACTIVITY_TEST;

/**
 * Calculate subsidised hours per week based on parent activity levels
 * 
 * @param {number} parent1HoursPerFortnight - Parent 1's work hours per fortnight
 * @param {number} parent2HoursPerFortnight - Parent 2's work hours per fortnight (default: 0 for single parent)
 * @returns {Object} Object with hoursPerWeek and hoursPerFortnight
 */
export function calculateSubsidisedHours(parent1HoursPerFortnight, parent2HoursPerFortnight = 0) {
  // Input validation
  if (typeof parent1HoursPerFortnight !== 'number' || parent1HoursPerFortnight < 0) {
    throw new Error('Parent 1 hours per fortnight must be a non-negative number');
  }
  
  if (typeof parent2HoursPerFortnight !== 'number' || parent2HoursPerFortnight < 0) {
    throw new Error('Parent 2 hours per fortnight must be a non-negative number');
  }
  
  // Determine lower-activity parent
  const lowerActivityHours = Math.min(parent1HoursPerFortnight, parent2HoursPerFortnight || Infinity);
  
  // All families: minimum 72 hours/fortnight (36 hours/week)
  // If lower-activity parent works >48 hours/fortnight → 100 hours/fortnight (50 hours/week)
  let hoursPerFortnight = ACTIVITY_TEST.BASE_HOURS_PER_FORTNIGHT;
  
  if (lowerActivityHours > ACTIVITY_TEST.HIGHER_ACTIVITY_THRESHOLD) {
    hoursPerFortnight = ACTIVITY_TEST.HIGHER_HOURS_PER_FORTNIGHT;
  }
  
  return {
    hoursPerWeek: hoursPerFortnight / 2,
    hoursPerFortnight
  };
}

/**
 * Calculate actual childcare hours needed per week based on parent work schedules
 * Considers overlapping work hours where both parents are working
 * 
 * @param {Object} parent1Schedule - {daysPerWeek, hoursPerDay}
 * @param {Object} parent2Schedule - {daysPerWeek, hoursPerDay} (optional)
 * @returns {Object} Object with actualHoursPerWeek and explanation
 */
export function calculateActualChildcareHours(parent1Schedule, parent2Schedule = null) {
  // Input validation
  if (!parent1Schedule || typeof parent1Schedule.daysPerWeek !== 'number' || typeof parent1Schedule.hoursPerDay !== 'number') {
    throw new Error('Parent 1 schedule must include daysPerWeek and hoursPerDay');
  }
  
  if (parent1Schedule.daysPerWeek < 0 || parent1Schedule.daysPerWeek > 7) {
    throw new Error('Days per week must be between 0 and 7');
  }
  
  if (parent1Schedule.hoursPerDay < 0 || parent1Schedule.hoursPerDay > 24) {
    throw new Error('Hours per day must be between 0 and 24');
  }
  
  // Single parent scenario
  if (!parent2Schedule) {
    const actualHoursPerWeek = parent1Schedule.daysPerWeek * parent1Schedule.hoursPerDay;
    return {
      actualHoursPerWeek,
      explanation: `Single parent working ${parent1Schedule.daysPerWeek} days × ${parent1Schedule.hoursPerDay} hours`
    };
  }
  
  // Validate parent 2 schedule
  if (typeof parent2Schedule.daysPerWeek !== 'number' || typeof parent2Schedule.hoursPerDay !== 'number') {
    throw new Error('Parent 2 schedule must include daysPerWeek and hoursPerDay');
  }
  
  if (parent2Schedule.daysPerWeek < 0 || parent2Schedule.daysPerWeek > 7) {
    throw new Error('Days per week must be between 0 and 7');
  }
  
  if (parent2Schedule.hoursPerDay < 0 || parent2Schedule.hoursPerDay > 24) {
    throw new Error('Hours per day must be between 0 and 24');
  }
  
  // Two-parent scenario
  // Simplified calculation: assume maximum overlap
  // In reality, this would need more detailed schedule information
  const parent1WeeklyHours = parent1Schedule.daysPerWeek * parent1Schedule.hoursPerDay;
  const parent2WeeklyHours = parent2Schedule.daysPerWeek * parent2Schedule.hoursPerDay;
  
  // Simple heuristic: use the maximum of the two parents' weekly hours
  // This assumes that when one parent is working, childcare is needed
  // More sophisticated logic would consider specific day/time overlaps
  const actualHoursPerWeek = Math.max(parent1WeeklyHours, parent2WeeklyHours);
  
  return {
    actualHoursPerWeek,
    explanation: `Maximum hours needed: max(${parent1WeeklyHours}, ${parent2WeeklyHours}) hours per week`
  };
}

/**
 * Calculate parent's hours per fortnight from their work schedule
 * 
 * @param {number} daysPerWeek - Number of days worked per week
 * @param {number} hoursPerDay - Number of hours worked per day
 * @returns {number} Hours per fortnight
 */
export function calculateHoursPerFortnight(daysPerWeek, hoursPerDay) {
  if (typeof daysPerWeek !== 'number' || daysPerWeek < 0 || daysPerWeek > 7) {
    throw new Error('Days per week must be between 0 and 7');
  }
  
  if (typeof hoursPerDay !== 'number' || hoursPerDay < 0 || hoursPerDay > 24) {
    throw new Error('Hours per day must be between 0 and 24');
  }
  
  return daysPerWeek * hoursPerDay * 2; // 2 weeks in a fortnight
}

/**
 * Determine which hours limit applies (subsidised vs actual)
 * The subsidy applies to the lesser of subsidised hours or actual hours needed
 * 
 * @param {number} subsidisedHours - Subsidised hours based on activity test
 * @param {number} actualHours - Actual childcare hours needed
 * @returns {Object} Object with appliedHours and reason
 */
export function determineApplicableHours(subsidisedHours, actualHours) {
  if (typeof subsidisedHours !== 'number' || subsidisedHours < 0) {
    throw new Error('Subsidised hours must be a non-negative number');
  }
  
  if (typeof actualHours !== 'number' || actualHours < 0) {
    throw new Error('Actual hours must be a non-negative number');
  }
  
  const appliedHours = Math.min(subsidisedHours, actualHours);
  
  let reason;
  if (appliedHours === subsidisedHours && subsidisedHours < actualHours) {
    reason = 'Limited by subsidised hours cap';
  } else if (appliedHours === actualHours && actualHours < subsidisedHours) {
    reason = 'Limited by actual childcare hours needed';
  } else {
    reason = 'Subsidised hours equals actual hours needed';
  }
  
  return {
    appliedHours,
    reason,
    subsidisedHours,
    actualHours
  };
}

// Export constants for testing and reference
export { ACTIVITY_TEST_CONSTANTS };
