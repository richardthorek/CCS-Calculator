/**
 * Unit tests for subsidy rate calculation module
 */

import {
  calculateStandardRate,
  calculateHigherRate,
  calculateChildSubsidyRate,
  calculateMultipleChildrenRates,
  SUBSIDY_CONSTANTS
} from '../../src/js/calculations/subsidy-rate.js';

describe('Subsidy Rate Calculations', () => {
  describe('calculateStandardRate', () => {
    test('returns 90% for income at $0', () => {
      expect(calculateStandardRate(0)).toBe(90);
    });

    test('returns 90% for income at $85,279 (threshold)', () => {
      expect(calculateStandardRate(85279)).toBe(90);
    });

    test('returns 89% for income at $85,280 (taper start)', () => {
      expect(calculateStandardRate(85280)).toBe(89);
    });

    test('returns 89% for income at $90,279 (within first bracket)', () => {
      expect(calculateStandardRate(90279)).toBe(89);
    });

    test('returns 88% for income at $90,280', () => {
      expect(calculateStandardRate(90280)).toBe(88);
    });

    test('returns 50% for income at $285,279', () => {
      expect(calculateStandardRate(285279)).toBe(50);
    });

    test('returns 1% for income at $530,279', () => {
      expect(calculateStandardRate(530279)).toBe(1);
    });

    test('returns 0% for income at $535,279 (threshold)', () => {
      expect(calculateStandardRate(535279)).toBe(0);
    });

    test('returns 0% for income above $535,279', () => {
      expect(calculateStandardRate(600000)).toBe(0);
    });

    test('handles edge case at exact $100,000', () => {
      const incomeAboveStart = 100000 - 85280;
      const bracketNumber = Math.floor(incomeAboveStart / 5000);
      const expected = 90 - (bracketNumber + 1);
      expect(calculateStandardRate(100000)).toBe(expected);
    });

    test('throws error for negative income', () => {
      expect(() => calculateStandardRate(-1000)).toThrow('Household income must be a non-negative number');
    });

    test('throws error for non-numeric income', () => {
      expect(() => calculateStandardRate('100000')).toThrow('Household income must be a non-negative number');
    });
  });

  describe('calculateHigherRate', () => {
    test('returns 95% for income at $0', () => {
      expect(calculateHigherRate(0)).toBe(95);
    });

    test('returns 95% for income at $143,273 (threshold)', () => {
      expect(calculateHigherRate(143273)).toBe(95);
    });

    test('returns 94% for income at $143,274 (band 1 start)', () => {
      expect(calculateHigherRate(143274)).toBe(94);
    });

    test('returns 94% for income at $146,273', () => {
      expect(calculateHigherRate(146273)).toBe(94);
    });

    test('returns 93% for income at $146,274', () => {
      expect(calculateHigherRate(146274)).toBe(93);
    });

    test('returns 80% for income at $188,272 (band 1 end)', () => {
      expect(calculateHigherRate(188272)).toBe(80);
    });

    test('returns 80% for income at $188,273 (band 2 start)', () => {
      expect(calculateHigherRate(188273)).toBe(80);
    });

    test('returns 80% for income at $267,562 (band 2 end)', () => {
      expect(calculateHigherRate(267562)).toBe(80);
    });

    test('returns 79% for income at $267,563 (band 3 start)', () => {
      expect(calculateHigherRate(267563)).toBe(79);
    });

    test('returns 79% for income at $270,562', () => {
      expect(calculateHigherRate(270562)).toBe(79);
    });

    test('returns 78% for income at $270,563', () => {
      expect(calculateHigherRate(270563)).toBe(78);
    });

    test('returns 50% for income at $357,562 (band 3 end)', () => {
      expect(calculateHigherRate(357562)).toBe(50);
    });

    test('returns 50% for income at $357,563 (band 4 start)', () => {
      expect(calculateHigherRate(357563)).toBe(50);
    });

    test('returns 50% for income at $367,562 (band 4 end)', () => {
      expect(calculateHigherRate(367562)).toBe(50);
    });

    test('reverts to standard rate at $367,563', () => {
      const standardRate = calculateStandardRate(367563);
      expect(calculateHigherRate(367563)).toBe(standardRate);
    });

    test('reverts to standard rate for high income', () => {
      const standardRate = calculateStandardRate(500000);
      expect(calculateHigherRate(500000)).toBe(standardRate);
    });

    test('throws error for negative income', () => {
      expect(() => calculateHigherRate(-1000)).toThrow('Household income must be a non-negative number');
    });

    test('throws error for non-numeric income', () => {
      expect(() => calculateHigherRate('100000')).toThrow('Household income must be a non-negative number');
    });
  });

  describe('calculateChildSubsidyRate', () => {
    test('first child aged 3 uses standard rate', () => {
      const income = 100000;
      const expectedRate = calculateStandardRate(income);
      expect(calculateChildSubsidyRate(income, 3, 1)).toBe(expectedRate);
    });

    test('second child aged 3 uses higher rate', () => {
      const income = 100000;
      const expectedRate = calculateHigherRate(income);
      expect(calculateChildSubsidyRate(income, 3, 2)).toBe(expectedRate);
    });

    test('third child aged 2 uses higher rate', () => {
      const income = 100000;
      const expectedRate = calculateHigherRate(income);
      expect(calculateChildSubsidyRate(income, 2, 3)).toBe(expectedRate);
    });

    test('child aged 6 uses standard rate regardless of position', () => {
      const income = 100000;
      const expectedRate = calculateStandardRate(income);
      expect(calculateChildSubsidyRate(income, 6, 2)).toBe(expectedRate);
    });

    test('child aged 10 uses standard rate', () => {
      const income = 100000;
      const expectedRate = calculateStandardRate(income);
      expect(calculateChildSubsidyRate(income, 10, 1)).toBe(expectedRate);
    });

    test('defaults to position 1 if not specified', () => {
      const income = 100000;
      const expectedRate = calculateStandardRate(income);
      expect(calculateChildSubsidyRate(income, 3)).toBe(expectedRate);
    });

    test('throws error for negative income', () => {
      expect(() => calculateChildSubsidyRate(-1000, 3, 1)).toThrow('Household income must be a non-negative number');
    });

    test('throws error for negative age', () => {
      expect(() => calculateChildSubsidyRate(100000, -1, 1)).toThrow('Child age must be between 0 and 18');
    });

    test('throws error for age > 18', () => {
      expect(() => calculateChildSubsidyRate(100000, 19, 1)).toThrow('Child age must be between 0 and 18');
    });

    test('throws error for position < 1', () => {
      expect(() => calculateChildSubsidyRate(100000, 3, 0)).toThrow('Child position must be at least 1');
    });
  });

  describe('calculateMultipleChildrenRates', () => {
    test('calculates rates for single child', () => {
      const children = [{ age: 3 }];
      const result = calculateMultipleChildrenRates(100000, children);
      
      expect(result).toHaveLength(1);
      expect(result[0].age).toBe(3);
      expect(result[0].position).toBe(1);
      expect(result[0].isEldest).toBe(true);
      expect(result[0].usesHigherRate).toBe(false);
      expect(result[0].subsidyRate).toBe(calculateStandardRate(100000));
    });

    test('calculates rates for two children aged ≤5', () => {
      const children = [{ age: 4 }, { age: 2 }];
      const result = calculateMultipleChildrenRates(100000, children);
      
      expect(result).toHaveLength(2);
      
      // First child (oldest)
      expect(result[0].age).toBe(4);
      expect(result[0].position).toBe(1);
      expect(result[0].isEldest).toBe(true);
      expect(result[0].usesHigherRate).toBe(false);
      expect(result[0].subsidyRate).toBe(calculateStandardRate(100000));
      
      // Second child
      expect(result[1].age).toBe(2);
      expect(result[1].position).toBe(2);
      expect(result[1].isEldest).toBe(false);
      expect(result[1].usesHigherRate).toBe(true);
      expect(result[1].subsidyRate).toBe(calculateHigherRate(100000));
    });

    test('calculates rates for three children with mixed ages', () => {
      const children = [{ age: 7 }, { age: 4 }, { age: 2 }];
      const result = calculateMultipleChildrenRates(100000, children);
      
      expect(result).toHaveLength(3);
      
      // Oldest child (7 years, uses standard rate)
      expect(result[0].age).toBe(7);
      expect(result[0].position).toBe(1);
      expect(result[0].usesHigherRate).toBe(false);
      
      // Second child (4 years, uses higher rate)
      expect(result[1].age).toBe(4);
      expect(result[1].position).toBe(2);
      expect(result[1].usesHigherRate).toBe(true);
      
      // Third child (2 years, uses higher rate)
      expect(result[2].age).toBe(2);
      expect(result[2].position).toBe(3);
      expect(result[2].usesHigherRate).toBe(true);
    });

    test('sorts children by age (oldest first)', () => {
      const children = [{ age: 2 }, { age: 7 }, { age: 4 }];
      const result = calculateMultipleChildrenRates(100000, children);
      
      expect(result[0].age).toBe(7);
      expect(result[1].age).toBe(4);
      expect(result[2].age).toBe(2);
    });

    test('respects custom position if provided', () => {
      const children = [{ age: 3, position: 2 }];
      const result = calculateMultipleChildrenRates(100000, children);
      
      expect(result[0].position).toBe(2);
      expect(result[0].usesHigherRate).toBe(true);
    });

    test('throws error for empty array', () => {
      expect(() => calculateMultipleChildrenRates(100000, [])).toThrow('Children must be a non-empty array');
    });

    test('throws error for non-array', () => {
      expect(() => calculateMultipleChildrenRates(100000, 'not an array')).toThrow('Children must be a non-empty array');
    });

    test('throws error for negative income', () => {
      expect(() => calculateMultipleChildrenRates(-1000, [{ age: 3 }])).toThrow('Household income must be a non-negative number');
    });
  });

  describe('SUBSIDY_CONSTANTS', () => {
    test('exports standard rate thresholds', () => {
      expect(SUBSIDY_CONSTANTS.STANDARD_RATE_THRESHOLDS.MAX_90_PERCENT).toBe(85279);
      expect(SUBSIDY_CONSTANTS.STANDARD_RATE_THRESHOLDS.MIN_ZERO_PERCENT).toBe(535279);
    });

    test('exports higher rate thresholds', () => {
      expect(SUBSIDY_CONSTANTS.HIGHER_RATE_THRESHOLDS.MAX_95_PERCENT).toBe(143273);
      expect(SUBSIDY_CONSTANTS.HIGHER_RATE_THRESHOLDS.REVERT_TO_STANDARD).toBe(367563);
    });
  });
});
