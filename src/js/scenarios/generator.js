/**
 * Scenario Generator Module
 * Generates and manages childcare scenarios for comparison
 * Generates all combinations of work days to find optimal work/childcare balance
 */

import { calculateAdjustedIncome, calculateHouseholdIncome } from '../calculations/income.js';
import { calculateStandardRate, calculateHigherRate } from '../calculations/subsidy-rate.js';
import { calculateSubsidisedHours } from '../calculations/activity-test.js';
import { calculateEffectiveHourlyRate, calculateSubsidyPerHour, calculateWeeklyCosts } from '../calculations/costs.js';

/**
 * Generate all possible work scenario combinations (0-5 days for each parent)
 * This creates a comprehensive comparison to find the optimal work/childcare balance
 * @param {Object} baseData - Base family and childcare data
 * @returns {Array} Array of scenario objects
 */
export function generateAllScenarios(baseData) {
  const { parent1BaseIncome, parent2BaseIncome = 0, parent1HoursPerDay, parent2HoursPerDay = 0, children } = baseData;
  
  const scenarios = [];
  
  // Generate all combinations: each parent working 0-5 days
  for (let p1Days = 0; p1Days <= 5; p1Days++) {
    for (let p2Days = 0; p2Days <= 5; p2Days++) {
      // Skip if both parents not working (no income scenario)
      if (p1Days === 0 && p2Days === 0) {
        continue;
      }
      
      const scenarioName = generateScenarioName(p1Days, p2Days, parent2BaseIncome > 0);
      
      const scenario = createScenario({
        ...baseData,
        parent1Days: p1Days,
        parent2Days: p2Days,
        scenarioName,
      });
      
      if (scenario) {
        scenarios.push(scenario);
      }
    }
  }
  
  return scenarios;
}

/**
 * Generate common work scenario combinations (subset of most typical arrangements)
 * @param {Object} baseData - Base family and childcare data
 * @returns {Array} Array of scenario objects
 */
export function generateCommonScenarios(baseData) {
  const { parent1BaseIncome, parent2BaseIncome, parent1HoursPerDay, parent2HoursPerDay, children } = baseData;
  
  // Common work day combinations for two parents
  const commonCombinations = [
    { parent1Days: 5, parent2Days: 5, name: '5+5 days (Both full-time)' },
    { parent1Days: 5, parent2Days: 4, name: '5+4 days' },
    { parent1Days: 5, parent2Days: 3, name: '5+3 days' },
    { parent1Days: 5, parent2Days: 0, name: '5+0 days (One parent working)' },
    { parent1Days: 4, parent2Days: 4, name: '4+4 days' },
    { parent1Days: 4, parent2Days: 3, name: '4+3 days' },
    { parent1Days: 3, parent2Days: 3, name: '3+3 days' },
    { parent1Days: 3, parent2Days: 2, name: '3+2 days' },
    { parent1Days: 2, parent2Days: 2, name: '2+2 days' },
    { parent1Days: 2, parent2Days: 0, name: '2+0 days' },
  ];
  
  // If parent 2 has no income, only generate single-parent scenarios
  if (!parent2BaseIncome || parent2BaseIncome === 0) {
    return generateSingleParentScenarios(baseData);
  }
  
  // Generate scenarios for each combination
  const scenarios = commonCombinations.map(combo => {
    return createScenario({
      ...baseData,
      parent1Days: combo.parent1Days,
      parent2Days: combo.parent2Days,
      scenarioName: combo.name,
    });
  });
  
  // Remove duplicates and invalid scenarios
  return scenarios.filter(scenario => scenario !== null);
}

/**
 * Generate scenario name based on work days
 * @param {number} p1Days - Parent 1 work days
 * @param {number} p2Days - Parent 2 work days
 * @param {boolean} isTwoParent - Whether this is a two-parent family
 * @returns {string} Scenario name
 */
function generateScenarioName(p1Days, p2Days, isTwoParent = true) {
  if (!isTwoParent || p2Days === 0) {
    // Single parent scenario names
    if (p1Days === 0) return 'Not working';
    if (p1Days === 1) return '1 day';
    if (p1Days === 5) return '5 days (Full-time)';
    return `${p1Days} days`;
  }
  
  // Two parent scenario names
  if (p1Days === 5 && p2Days === 5) return '5+5 days (Both full-time)';
  if (p1Days === 0 && p2Days > 0) return `0+${p2Days} days (One parent home)`;
  if (p2Days === 0 && p1Days > 0) return `${p1Days}+0 days (One parent home)`;
  
  return `${p1Days}+${p2Days} days`;
}

/**
 * Generate scenarios for single parent families
 * @param {Object} baseData - Base family data
 * @returns {Array} Array of single parent scenarios
 */
export function generateSingleParentScenarios(baseData) {
  const { parent1BaseIncome, parent1HoursPerDay } = baseData;
  
  const singleParentCombinations = [
    { days: 5, name: '5 days (Full-time)' },
    { days: 4, name: '4 days' },
    { days: 3, name: '3 days' },
    { days: 2, name: '2 days' },
    { days: 1, name: '1 day' },
  ];
  
  return singleParentCombinations.map(combo => {
    return createScenario({
      ...baseData,
      parent1Days: combo.days,
      parent2Days: 0,
      scenarioName: combo.name,
    });
  }).filter(scenario => scenario !== null);
}

/**
 * Create a custom scenario with user-defined work days
 * @param {Object} scenarioData - Complete scenario data
 * @returns {Object} Calculated scenario
 */
export function createCustomScenario(scenarioData) {
  return createScenario(scenarioData);
}

/**
 * Calculate childcare hours needed based on parent work schedules
 * Key logic: If a parent isn't working, they're available for childcare
 * @param {number} p1Days - Parent 1 work days
 * @param {number} p2Days - Parent 2 work days
 * @param {number} p1Hours - Parent 1 hours per day
 * @param {number} p2Hours - Parent 2 hours per day
 * @param {number} childHoursPerWeek - Child's typical hours per week if both parents working
 * @returns {number} Actual childcare hours needed per week
 */
function calculateChildcareHoursNeeded(p1Days, p2Days, p1Hours, p2Hours, childHoursPerWeek) {
  // If neither parent is working, no childcare needed
  if (p1Days === 0 && p2Days === 0) {
    return 0;
  }
  
  // If one parent isn't working, they're home for childcare
  if (p1Days === 0 || p2Days === 0) {
    // Only need childcare when the working parent is at work
    const workingDays = Math.max(p1Days, p2Days);
    const workingHours = p1Days > 0 ? p1Hours : p2Hours;
    return workingDays * workingHours;
  }
  
  // Both parents working - need childcare during overlapping work hours
  // This is a simplified model - assumes they work same days
  const overlappingDays = Math.min(p1Days, p2Days);
  const maxHoursPerDay = Math.max(p1Hours, p2Hours);
  
  // For non-overlapping days, still might need some childcare
  const nonOverlappingDays = Math.abs(p1Days - p2Days);
  const minHours = Math.min(p1Hours, p2Hours);
  
  return (overlappingDays * maxHoursPerDay) + (nonOverlappingDays * minHours);
}

/**
 * Create a scenario and calculate all results
 * @param {Object} data - Scenario data
 * @returns {Object|null} Calculated scenario or null if invalid
 */
function createScenario(data) {
  try {
    const {
      parent1BaseIncome,
      parent2BaseIncome = 0,
      parent1Days,
      parent2Days = 0,
      parent1HoursPerDay,
      parent2HoursPerDay = 0,
      children,
      scenarioName = generateScenarioName(parent1Days, parent2Days, parent2BaseIncome > 0),
    } = data;
    
    // Calculate adjusted incomes (0 if not working)
    const parent1Income = parent1Days > 0 ? calculateAdjustedIncome(
      parent1BaseIncome,
      parent1Days,
      parent1HoursPerDay
    ) : 0;
    
    const parent2Income = (parent2BaseIncome > 0 && parent2Days > 0) ? calculateAdjustedIncome(
      parent2BaseIncome,
      parent2Days,
      parent2HoursPerDay
    ) : 0;
    
    const householdIncome = calculateHouseholdIncome(parent1Income, parent2Income);
    
    // Calculate subsidised hours
    const parent1FortnightHours = parent1Days * parent1HoursPerDay * 2;
    const parent2FortnightHours = parent2Days * parent2HoursPerDay * 2;
    const subsidisedHoursResult = calculateSubsidisedHours(
      parent1FortnightHours,
      parent2FortnightHours
    );
    const subsidisedHours = subsidisedHoursResult.hoursPerWeek;
    
    // Calculate costs for each child
    const childResults = children.map((child, index) => {
      const { age, careType, hoursPerWeek, providerFee } = child;
      
      // Calculate actual childcare hours needed based on parent availability
      const actualHoursNeeded = calculateChildcareHoursNeeded(
        parent1Days,
        parent2Days,
        parent1HoursPerDay,
        parent2HoursPerDay,
        hoursPerWeek
      );
      
      // If no childcare needed, return zero costs
      if (actualHoursNeeded === 0) {
        return {
          age,
          careType,
          subsidyRate: 0,
          subsidyPerHour: 0,
          weeklySubsidy: 0,
          weeklyFullCost: 0,
          weeklyOutOfPocket: 0,
          hoursWithSubsidy: 0,
          hoursWithoutSubsidy: 0,
        };
      }
      
      // Determine if this is the eldest child aged ≤5
      const childrenUnder6 = children.filter(c => c.age <= 5);
      const isEldestUnder6 = childrenUnder6.length > 0 && 
                             age <= 5 && 
                             age === Math.max(...childrenUnder6.map(c => c.age));
      
      // Calculate subsidy rate
      let subsidyRate;
      if (isEldestUnder6) {
        subsidyRate = calculateStandardRate(householdIncome);
      } else if (age <= 5) {
        subsidyRate = calculateHigherRate(householdIncome);
      } else {
        subsidyRate = calculateStandardRate(householdIncome);
      }
      
      // Calculate effective hourly rate and costs
      const effectiveRate = calculateEffectiveHourlyRate(providerFee, careType, age);
      const subsidyPerHour = calculateSubsidyPerHour(subsidyRate, effectiveRate);
      
      const maxSubsidisedHours = Math.min(actualHoursNeeded, subsidisedHours);
      const weeklyCosts = calculateWeeklyCosts({
        subsidyPerHour,
        providerFee,
        subsidisedHours: maxSubsidisedHours,
        actualHours: actualHoursNeeded
      });
      
      return {
        age,
        careType,
        subsidyRate,
        subsidyPerHour,
        ...weeklyCosts,
      };
    });
    
    // Aggregate total costs
    const totalWeeklySubsidy = childResults.reduce((sum, child) => sum + child.weeklySubsidy, 0);
    const totalWeeklyCost = childResults.reduce((sum, child) => sum + child.weeklyFullCost, 0);
    const totalWeeklyOutOfPocket = childResults.reduce((sum, child) => sum + child.weeklyOutOfPocket, 0);
    
    const annualSubsidy = totalWeeklySubsidy * 52;
    const annualCost = totalWeeklyCost * 52;
    const annualOutOfPocket = totalWeeklyOutOfPocket * 52;
    
    // Calculate net income after childcare
    const netIncomeAfterChildcare = householdIncome - annualOutOfPocket;
    const childcareCostPercentage = householdIncome > 0 
      ? (annualOutOfPocket / householdIncome) * 100 
      : 0;
    
    return {
      id: generateScenarioId(scenarioName, parent1Days, parent2Days),
      name: scenarioName,
      parent1Days,
      parent2Days,
      parent1Income,
      parent2Income,
      householdIncome,
      subsidisedHours: subsidisedHoursResult,
      childResults,
      totalWeeklySubsidy,
      totalWeeklyCost,
      totalWeeklyOutOfPocket,
      annualSubsidy,
      annualCost,
      annualOutOfPocket,
      netIncomeAfterChildcare,
      childcareCostPercentage,
      isFavorite: false,
      isCustom: false,
    };
  } catch (error) {
    console.error('Error creating scenario:', error);
    return null;
  }
}

/**
 * Generate a unique ID for a scenario
 * @param {string} name - Scenario name
 * @param {number} p1Days - Parent 1 days
 * @param {number} p2Days - Parent 2 days
 * @returns {string} Unique ID
 */
function generateScenarioId(name, p1Days, p2Days) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `scenario-${p1Days}-${p2Days}-${randomStr}-${timestamp}`;
}

/**
 * Compare two scenarios by a specific metric
 * @param {Object} scenario1 - First scenario
 * @param {Object} scenario2 - Second scenario
 * @param {string} metric - Metric to compare ('netIncome', 'outOfPocket', 'subsidy', etc.)
 * @param {string} order - 'asc' or 'desc'
 * @returns {number} Comparison result
 */
export function compareScenarios(scenario1, scenario2, metric = 'netIncomeAfterChildcare', order = 'desc') {
  let value1, value2;
  
  switch (metric) {
    case 'netIncome':
    case 'netIncomeAfterChildcare':
      value1 = scenario1.netIncomeAfterChildcare;
      value2 = scenario2.netIncomeAfterChildcare;
      break;
    case 'outOfPocket':
    case 'annualOutOfPocket':
      value1 = scenario1.annualOutOfPocket;
      value2 = scenario2.annualOutOfPocket;
      break;
    case 'subsidy':
    case 'annualSubsidy':
      value1 = scenario1.annualSubsidy;
      value2 = scenario2.annualSubsidy;
      break;
    case 'workDays':
      value1 = scenario1.parent1Days + scenario1.parent2Days;
      value2 = scenario2.parent1Days + scenario2.parent2Days;
      break;
    case 'costPercentage':
    case 'childcareCostPercentage':
      value1 = scenario1.childcareCostPercentage;
      value2 = scenario2.childcareCostPercentage;
      break;
    default:
      value1 = scenario1.netIncomeAfterChildcare;
      value2 = scenario2.netIncomeAfterChildcare;
  }
  
  if (order === 'asc') {
    return value1 - value2;
  } else {
    return value2 - value1;
  }
}

/**
 * Filter scenarios by criteria
 * @param {Array} scenarios - Array of scenarios
 * @param {Object} criteria - Filter criteria
 * @returns {Array} Filtered scenarios
 */
export function filterScenarios(scenarios, criteria = {}) {
  return scenarios.filter(scenario => {
    // Filter by minimum net income
    if (criteria.minNetIncome && scenario.netIncomeAfterChildcare < criteria.minNetIncome) {
      return false;
    }
    
    // Filter by maximum out of pocket
    if (criteria.maxOutOfPocket && scenario.annualOutOfPocket > criteria.maxOutOfPocket) {
      return false;
    }
    
    // Filter by work days
    if (criteria.minWorkDays) {
      const totalDays = scenario.parent1Days + scenario.parent2Days;
      if (totalDays < criteria.minWorkDays) {
        return false;
      }
    }
    
    if (criteria.maxWorkDays) {
      const totalDays = scenario.parent1Days + scenario.parent2Days;
      if (totalDays > criteria.maxWorkDays) {
        return false;
      }
    }
    
    // Filter favorites
    if (criteria.favoritesOnly && !scenario.isFavorite) {
      return false;
    }
    
    return true;
  });
}

/**
 * Find the best scenario based on a metric
 * @param {Array} scenarios - Array of scenarios
 * @param {string} metric - Metric to optimize
 * @returns {Object|null} Best scenario
 */
export function findBestScenario(scenarios, metric = 'netIncomeAfterChildcare') {
  if (!scenarios || scenarios.length === 0) {
    return null;
  }
  
  const sorted = [...scenarios].sort((a, b) => compareScenarios(a, b, metric, 'desc'));
  return sorted[0];
}
