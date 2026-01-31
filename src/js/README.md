# CCS Calculation Modules

This directory contains the core calculation engine for the CCS Calculator.

## Modules

### 1. Configuration (`/config/ccs-config.js`)
Centralized configuration for all CCS rates, thresholds, and constants.

**Key Exports:**
- `STANDARD_RATE_THRESHOLDS` - Income thresholds for standard subsidy rates
- `HIGHER_RATE_THRESHOLDS` - Income thresholds for higher subsidy rates (younger siblings)
- `ACTIVITY_TEST` - Activity test thresholds for subsidised hours
- `HOURLY_RATE_CAPS` - Rate caps by care type and child age
- `CARE_TYPES` - Care type constants
- `AGE_CATEGORIES` - Age category thresholds
- `WORK_DEFAULTS` - Default work parameters
- `VALIDATION_LIMITS` - Input validation limits
- `FINANCIAL_YEAR` - Current financial year info
- `getHourlyRateCap()` - Helper function to get rate cap

### 2. Income Calculations (`/calculations/income.js`)
Calculates adjusted and household income.

**Key Functions:**
- `calculateAdjustedIncome(annualIncome, workDaysPerWeek, workHoursPerDay, fullTimeHours)`
- `calculateHouseholdIncome(parent1Income, parent2Income)`
- `splitHouseholdIncome(combinedIncome, parent1Ratio)`
- `validateIncome(income, minIncome, maxIncome)`

### 3. Subsidy Rate Calculations (`/calculations/subsidy-rate.js`)
Calculates CCS subsidy percentage based on income and child details.

**Key Functions:**
- `calculateStandardRate(householdIncome)` - For eldest child ≤5 years
- `calculateHigherRate(householdIncome)` - For younger siblings ≤5 years
- `calculateChildSubsidyRate(householdIncome, childAge, childPosition)`
- `calculateMultipleChildrenRates(householdIncome, children)`

### 4. Activity Test (`/calculations/activity-test.js`)
Determines subsidised hours based on parent work activity.

**Key Functions:**
- `calculateSubsidisedHours(parent1Hours, parent2Hours)` - Returns 72 or 100 hours/fortnight
- `calculateActualChildcareHours(parent1Schedule, parent2Schedule)`
- `calculateHoursPerFortnight(daysPerWeek, hoursPerDay)`
- `determineApplicableHours(subsidisedHours, actualHours)`

### 5. Cost Calculations (`/calculations/costs.js`)
Calculates all childcare costs, subsidies, and financial outcomes.

**Key Functions:**
- `calculateEffectiveHourlyRate(providerFee, careType, childAge)`
- `calculateSubsidyPerHour(subsidyRate, effectiveHourlyRate)`
- `calculateWeeklyCosts(params)` - Returns weekly subsidy, costs, out-of-pocket
- `calculateAnnualCost(weeklyCost, weeksPerYear)`
- `calculateNetIncome(householdIncome, annualChildcareCost)`
- `calculateCostAsPercentageOfIncome(annualCost, householdIncome)`
- `calculateCompleteCostBreakdown(params)` - Complete calculation in one call

## Usage Example

```javascript
import { CCS_CONFIG } from './config/ccs-config.js';
import { calculateAdjustedIncome, calculateHouseholdIncome } from './calculations/income.js';
import { calculateChildSubsidyRate } from './calculations/subsidy-rate.js';
import { calculateSubsidisedHours } from './calculations/activity-test.js';
import { calculateCompleteCostBreakdown } from './calculations/costs.js';

// Calculate adjusted incomes
const parent1Income = calculateAdjustedIncome(100000, 5, 7.6);
const parent2Income = calculateAdjustedIncome(80000, 3, 7.6);
const householdIncome = calculateHouseholdIncome(parent1Income, parent2Income);

// Get subsidy rate for child
const subsidyRate = calculateChildSubsidyRate(householdIncome, 3, 1);

// Calculate subsidised hours
const { hoursPerWeek } = calculateSubsidisedHours(80, 45.6);

// Calculate complete cost breakdown
const costs = calculateCompleteCostBreakdown({
  householdIncome,
  subsidyRate,
  providerFee: 15.00,
  careType: CCS_CONFIG.CARE_TYPES.CENTRE_BASED,
  childAge: 3,
  subsidisedHours: hoursPerWeek,
  actualHours: 40
});

console.log('Weekly out-of-pocket:', costs.weekly.weeklyOutOfPocket);
console.log('Net annual income:', costs.netIncome);
console.log('Cost as % of income:', costs.costPercentage);
```

## Testing

Run tests:
```bash
npm test
```

Run specific module tests:
```bash
npm test -- income.test.js
npm test -- subsidy-rate.test.js
npm test -- activity-test.test.js
npm test -- costs.test.js
```

Test coverage:
```bash
npm run test:coverage
```

## Documentation

- Full calculation documentation: `/documentation/calculations.md`
- Includes formulas, examples, and update process for new financial years

## Annual Updates

When CCS rates change for a new financial year:

1. Update `/config/ccs-config.js` with new values
2. Update `FINANCIAL_YEAR` object
3. Run `npm test` to verify all calculations
4. Update `/documentation/calculations.md` with new rates
5. Update README.md

## Current Version

**Financial Year:** 2025-26  
**Last Updated:** 2026-01-31  
**Test Coverage:** 180 tests, all passing
