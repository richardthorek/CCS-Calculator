/**
 * Unit tests for income calculation module
 */

import {
  calculateAdjustedIncome,
  calculateHouseholdIncome,
  splitHouseholdIncome,
  validateIncome
} from '../../src/js/calculations/income.js';

describe('Income Calculations', () => {
  describe('calculateAdjustedIncome', () => {
    test('calculates adjusted income for full-time worker (5 days, 7.6 hours)', () => {
      const result = calculateAdjustedIncome(100000, 5, 7.6);
      expect(result).toBe(100000);
    });

    test('calculates adjusted income for 4 day week', () => {
      const result = calculateAdjustedIncome(100000, 4, 7.6);
      expect(result).toBe(80000);
    });

    test('calculates adjusted income for 3 day week', () => {
      const result = calculateAdjustedIncome(100000, 3, 7.6);
      expect(result).toBe(60000);
    });

    test('calculates adjusted income for part-time hours (5 days, 5 hours) - ignores hours', () => {
      // Hours per day no longer affects income calculation
      const result = calculateAdjustedIncome(100000, 5, 5, 7.6);
      expect(result).toBe(100000); // 5 days = 100% regardless of hours
    });

    test('calculates adjusted income for 3 days, 5 hours per day - ignores hours', () => {
      // Hours per day no longer affects income calculation
      const result = calculateAdjustedIncome(100000, 3, 5, 7.6);
      expect(result).toBe(60000); // 3 days = 60% regardless of hours
    });
    
    test('calculates adjusted income for 1 day week (20%)', () => {
      const result = calculateAdjustedIncome(100000, 1, 7.6);
      expect(result).toBe(20000);
    });
    
    test('calculates adjusted income for 2 day week (40%)', () => {
      const result = calculateAdjustedIncome(100000, 2, 7.6);
      expect(result).toBe(40000);
    });

    test('returns 0 for zero days worked', () => {
      const result = calculateAdjustedIncome(100000, 0, 7.6);
      expect(result).toBe(0);
    });

    test('hours per day does not affect income (kept for backwards compatibility)', () => {
      // Hours per day parameter is kept for API compatibility but doesn't affect income
      const result = calculateAdjustedIncome(100000, 5, 0);
      expect(result).toBe(100000); // Income is based on days only
    });

    test('returns 0 for zero income', () => {
      const result = calculateAdjustedIncome(0, 5, 7.6);
      expect(result).toBe(0);
    });

    test('throws error for negative annual income', () => {
      expect(() => calculateAdjustedIncome(-1000, 5, 7.6)).toThrow('Annual income must be a non-negative number');
    });

    test('throws error for work days > 5', () => {
      expect(() => calculateAdjustedIncome(100000, 6, 7.6)).toThrow('Work days per week must be between 0 and 5');
    });

    test('throws error for negative work days', () => {
      expect(() => calculateAdjustedIncome(100000, -1, 7.6)).toThrow('Work days per week must be between 0 and 5');
    });

    test('throws error for work hours > 24', () => {
      expect(() => calculateAdjustedIncome(100000, 5, 25)).toThrow('Work hours per day must be between 0 and 24');
    });

    test('throws error for negative work hours', () => {
      expect(() => calculateAdjustedIncome(100000, 5, -1)).toThrow('Work hours per day must be between 0 and 24');
    });

    test('throws error for non-numeric annual income', () => {
      expect(() => calculateAdjustedIncome('100000', 5, 7.6)).toThrow('Annual income must be a non-negative number');
    });
  });

  describe('calculateHouseholdIncome', () => {
    test('calculates household income for two working parents', () => {
      const result = calculateHouseholdIncome(80000, 60000);
      expect(result).toBe(140000);
    });

    test('calculates household income for single parent', () => {
      const result = calculateHouseholdIncome(80000);
      expect(result).toBe(80000);
    });

    test('calculates household income for single parent with explicit 0', () => {
      const result = calculateHouseholdIncome(80000, 0);
      expect(result).toBe(80000);
    });

    test('handles zero income for both parents', () => {
      const result = calculateHouseholdIncome(0, 0);
      expect(result).toBe(0);
    });

    test('throws error for negative parent 1 income', () => {
      expect(() => calculateHouseholdIncome(-1000, 60000)).toThrow('Parent 1 adjusted income must be a non-negative number');
    });

    test('throws error for negative parent 2 income', () => {
      expect(() => calculateHouseholdIncome(80000, -1000)).toThrow('Parent 2 adjusted income must be a non-negative number');
    });

    test('throws error for non-numeric parent 1 income', () => {
      expect(() => calculateHouseholdIncome('80000', 60000)).toThrow('Parent 1 adjusted income must be a non-negative number');
    });
  });

  describe('splitHouseholdIncome', () => {
    test('splits income 50/50 by default', () => {
      const result = splitHouseholdIncome(100000);
      expect(result.parent1Income).toBe(50000);
      expect(result.parent2Income).toBe(50000);
    });

    test('splits income 60/40', () => {
      const result = splitHouseholdIncome(100000, 0.6);
      expect(result.parent1Income).toBe(60000);
      expect(result.parent2Income).toBe(40000);
    });

    test('splits income 70/30', () => {
      const result = splitHouseholdIncome(100000, 0.7);
      expect(result.parent1Income).toBeCloseTo(70000, 2);
      expect(result.parent2Income).toBeCloseTo(30000, 2);
    });

    test('handles 100% to parent 1', () => {
      const result = splitHouseholdIncome(100000, 1);
      expect(result.parent1Income).toBe(100000);
      expect(result.parent2Income).toBe(0);
    });

    test('handles 0% to parent 1 (100% to parent 2)', () => {
      const result = splitHouseholdIncome(100000, 0);
      expect(result.parent1Income).toBe(0);
      expect(result.parent2Income).toBe(100000);
    });

    test('throws error for negative combined income', () => {
      expect(() => splitHouseholdIncome(-100000)).toThrow('Combined income must be a non-negative number');
    });

    test('throws error for ratio > 1', () => {
      expect(() => splitHouseholdIncome(100000, 1.5)).toThrow('Parent 1 ratio must be between 0 and 1');
    });

    test('throws error for negative ratio', () => {
      expect(() => splitHouseholdIncome(100000, -0.5)).toThrow('Parent 1 ratio must be between 0 and 1');
    });
  });

  describe('validateIncome', () => {
    test('validates positive income', () => {
      expect(validateIncome(50000)).toBe(true);
    });

    test('validates zero income', () => {
      expect(validateIncome(0)).toBe(true);
    });

    test('validates income at maximum threshold', () => {
      expect(validateIncome(10000000)).toBe(true);
    });

    test('validates income with custom min/max', () => {
      expect(validateIncome(5000, 1000, 100000)).toBe(true);
    });

    test('throws error for negative income', () => {
      expect(() => validateIncome(-1000)).toThrow('Income must be at least 0');
    });

    test('throws error for income exceeding maximum', () => {
      expect(() => validateIncome(10000001)).toThrow('Income must not exceed 10000000');
    });

    test('throws error for non-numeric income', () => {
      expect(() => validateIncome('50000')).toThrow('Income must be a valid number');
    });

    test('throws error for NaN', () => {
      expect(() => validateIncome(NaN)).toThrow('Income must be a valid number');
    });

    test('validates with custom minimum', () => {
      expect(() => validateIncome(500, 1000)).toThrow('Income must be at least 1000');
    });

    test('validates with custom maximum', () => {
      expect(() => validateIncome(150000, 0, 100000)).toThrow('Income must not exceed 100000');
    });
  });
});
