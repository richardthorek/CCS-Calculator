import { knownCalculationScenario } from '../fixtures/known-calculation-scenario.js';
import { calculateAdjustedIncome, calculateHouseholdIncome } from '../../src/js/calculations/income.js';
import { calculateStandardRate } from '../../src/js/calculations/subsidy-rate.js';
import { calculateHoursPerFortnight, calculateSubsidisedDays, calculateSubsidisedHours } from '../../src/js/calculations/activity-test.js';
import { calculateEffectiveDailyRate, calculateSubsidyPerDay, calculateWeeklyCostsFromDailyRate } from '../../src/js/calculations/costs.js';

describe('Known scenario parity (unit baseline for UI)', () => {
  test('returns expected deterministic outputs for the reference input set', () => {
    const { input, expected } = knownCalculationScenario;

    const parent1AdjustedIncome = calculateAdjustedIncome(
      input.parent1.annualIncomeFte,
      input.parent1.daysPerWeek,
      input.parent1.hoursPerDay
    );

    const parent2AdjustedIncome = calculateAdjustedIncome(
      input.parent2.annualIncomeFte,
      input.parent2.daysPerWeek,
      input.parent2.hoursPerDay
    );

    const householdIncome = calculateHouseholdIncome(parent1AdjustedIncome, parent2AdjustedIncome);
    const ccsRatePercent = calculateStandardRate(householdIncome);

    const parent1HoursPerFortnight = calculateHoursPerFortnight(
      input.parent1.daysPerWeek,
      input.parent1.hoursPerDay
    );
    const parent2HoursPerFortnight = calculateHoursPerFortnight(
      input.parent2.daysPerWeek,
      input.parent2.hoursPerDay
    );

    const subsidisedHours = calculateSubsidisedHours(parent1HoursPerFortnight, parent2HoursPerFortnight);
    const subsidisedDays = calculateSubsidisedDays(
      parent1HoursPerFortnight,
      parent2HoursPerFortnight,
      input.child.hoursPerDay
    );

    const effectiveDailyRate = calculateEffectiveDailyRate(
      input.child.dailyFee,
      input.child.careType,
      input.child.age,
      input.child.hoursPerDay
    );

    const subsidyPerDay = calculateSubsidyPerDay(ccsRatePercent, effectiveDailyRate);

    const weeklyCosts = calculateWeeklyCostsFromDailyRate({
      subsidyPerDay,
      providerDailyFee: input.child.dailyFee,
      subsidisedDays: subsidisedDays.daysPerWeek,
      actualDays: input.child.daysOfCare,
      withholdingRate: input.withholdingRate
    });

    expect(parent1AdjustedIncome).toBe(expected.adjustedIncomeParent1);
    expect(parent2AdjustedIncome).toBe(expected.adjustedIncomeParent2);
    expect(householdIncome).toBe(expected.householdIncome);
    expect(ccsRatePercent).toBe(expected.ccsRatePercent);
    expect(subsidisedHours.hoursPerWeek).toBe(expected.subsidisedHoursPerWeek);
    expect(subsidisedDays.daysPerWeek).toBe(expected.subsidisedDaysPerWeek);
    expect(effectiveDailyRate).toBeCloseTo(expected.effectiveDailyRate, 2);
    expect(subsidyPerDay).toBeCloseTo(expected.subsidyPerDay, 2);
    expect(weeklyCosts.weeklyGrossSubsidy).toBeCloseTo(expected.weeklyGrossSubsidy, 2);
    expect(weeklyCosts.weeklyWithheld).toBeCloseTo(expected.weeklyWithheld, 2);
    expect(weeklyCosts.weeklySubsidy).toBeCloseTo(expected.weeklySubsidy, 2);
    expect(weeklyCosts.weeklyFullCost).toBeCloseTo(expected.weeklyFullCost, 2);
    expect(weeklyCosts.weeklyOutOfPocket).toBeCloseTo(expected.weeklyOutOfPocket, 2);
  });
});
