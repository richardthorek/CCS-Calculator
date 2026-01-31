/**
 * Unit tests for activity test calculation module
 */

import {
  calculateSubsidisedHours,
  calculateActualChildcareHours,
  calculateHoursPerFortnight,
  determineApplicableHours,
  ACTIVITY_TEST_CONSTANTS
} from '../../src/js/calculations/activity-test.js';

describe('Activity Test Calculations', () => {
  describe('calculateSubsidisedHours', () => {
    test('returns base 72 hours/fortnight for single parent working <= 48 hours/fortnight', () => {
      const result = calculateSubsidisedHours(40);
      expect(result.hoursPerFortnight).toBe(72);
      expect(result.hoursPerWeek).toBe(36);
    });

    test('returns higher 100 hours/fortnight for single parent working > 48 hours/fortnight', () => {
      const result = calculateSubsidisedHours(50);
      expect(result.hoursPerFortnight).toBe(100);
      expect(result.hoursPerWeek).toBe(50);
    });

    test('returns base 72 hours for two parents when lower activity <= 48', () => {
      const result = calculateSubsidisedHours(76, 40);
      expect(result.hoursPerFortnight).toBe(72);
      expect(result.hoursPerWeek).toBe(36);
    });

    test('returns higher 100 hours when both parents work > 48 hours/fortnight', () => {
      const result = calculateSubsidisedHours(76, 50);
      expect(result.hoursPerFortnight).toBe(100);
      expect(result.hoursPerWeek).toBe(50);
    });

    test('returns higher 100 hours when lower-activity parent works exactly 49 hours', () => {
      const result = calculateSubsidisedHours(76, 49);
      expect(result.hoursPerFortnight).toBe(100);
      expect(result.hoursPerWeek).toBe(50);
    });

    test('returns base 72 hours when lower-activity parent works exactly 48 hours', () => {
      const result = calculateSubsidisedHours(76, 48);
      expect(result.hoursPerFortnight).toBe(72);
      expect(result.hoursPerWeek).toBe(36);
    });

    test('correctly identifies lower-activity parent', () => {
      const result1 = calculateSubsidisedHours(30, 60);
      const result2 = calculateSubsidisedHours(60, 30);
      
      expect(result1.hoursPerFortnight).toBe(72);
      expect(result2.hoursPerFortnight).toBe(72);
    });

    test('returns base hours for zero hours', () => {
      const result = calculateSubsidisedHours(0);
      expect(result.hoursPerFortnight).toBe(72);
      expect(result.hoursPerWeek).toBe(36);
    });

    test('handles single parent with explicit 0 for parent 2', () => {
      const result = calculateSubsidisedHours(50, 0);
      expect(result.hoursPerFortnight).toBe(100);
    });

    test('throws error for negative parent 1 hours', () => {
      expect(() => calculateSubsidisedHours(-10)).toThrow('Parent 1 hours per fortnight must be a non-negative number');
    });

    test('throws error for negative parent 2 hours', () => {
      expect(() => calculateSubsidisedHours(50, -10)).toThrow('Parent 2 hours per fortnight must be a non-negative number');
    });

    test('throws error for non-numeric parent 1 hours', () => {
      expect(() => calculateSubsidisedHours('50')).toThrow('Parent 1 hours per fortnight must be a non-negative number');
    });
  });

  describe('calculateActualChildcareHours', () => {
    test('calculates hours for single parent', () => {
      const result = calculateActualChildcareHours({ daysPerWeek: 5, hoursPerDay: 8 });
      expect(result.actualHoursPerWeek).toBe(40);
      expect(result.explanation).toContain('Single parent');
    });

    test('calculates hours for single parent working 3 days', () => {
      const result = calculateActualChildcareHours({ daysPerWeek: 3, hoursPerDay: 7.6 });
      expect(result.actualHoursPerWeek).toBeCloseTo(22.8, 1);
    });

    test('calculates hours for two parents with different schedules', () => {
      const result = calculateActualChildcareHours(
        { daysPerWeek: 5, hoursPerDay: 8 },
        { daysPerWeek: 3, hoursPerDay: 6 }
      );
      expect(result.actualHoursPerWeek).toBe(40); // max(40, 18)
    });

    test('uses maximum of two parents hours', () => {
      const result = calculateActualChildcareHours(
        { daysPerWeek: 3, hoursPerDay: 8 },
        { daysPerWeek: 5, hoursPerDay: 7 }
      );
      expect(result.actualHoursPerWeek).toBe(35); // max(24, 35)
    });

    test('handles zero hours for single parent', () => {
      const result = calculateActualChildcareHours({ daysPerWeek: 0, hoursPerDay: 0 });
      expect(result.actualHoursPerWeek).toBe(0);
    });

    test('handles one parent not working', () => {
      const result = calculateActualChildcareHours(
        { daysPerWeek: 5, hoursPerDay: 8 },
        { daysPerWeek: 0, hoursPerDay: 0 }
      );
      expect(result.actualHoursPerWeek).toBe(40);
    });

    test('throws error for missing daysPerWeek in parent 1 schedule', () => {
      expect(() => calculateActualChildcareHours({ hoursPerDay: 8 }))
        .toThrow('Parent 1 schedule must include daysPerWeek and hoursPerDay');
    });

    test('throws error for missing hoursPerDay in parent 1 schedule', () => {
      expect(() => calculateActualChildcareHours({ daysPerWeek: 5 }))
        .toThrow('Parent 1 schedule must include daysPerWeek and hoursPerDay');
    });

    test('throws error for days > 7', () => {
      expect(() => calculateActualChildcareHours({ daysPerWeek: 8, hoursPerDay: 8 }))
        .toThrow('Days per week must be between 0 and 7');
    });

    test('throws error for negative days', () => {
      expect(() => calculateActualChildcareHours({ daysPerWeek: -1, hoursPerDay: 8 }))
        .toThrow('Days per week must be between 0 and 7');
    });

    test('throws error for hours > 24', () => {
      expect(() => calculateActualChildcareHours({ daysPerWeek: 5, hoursPerDay: 25 }))
        .toThrow('Hours per day must be between 0 and 24');
    });

    test('throws error for invalid parent 2 schedule', () => {
      expect(() => calculateActualChildcareHours(
        { daysPerWeek: 5, hoursPerDay: 8 },
        { daysPerWeek: 5 }
      )).toThrow('Parent 2 schedule must include daysPerWeek and hoursPerDay');
    });
  });

  describe('calculateHoursPerFortnight', () => {
    test('calculates hours for 5 days × 8 hours', () => {
      expect(calculateHoursPerFortnight(5, 8)).toBe(80);
    });

    test('calculates hours for 3 days × 7.6 hours', () => {
      expect(calculateHoursPerFortnight(3, 7.6)).toBeCloseTo(45.6, 1);
    });

    test('calculates hours for 4 days × 6 hours', () => {
      expect(calculateHoursPerFortnight(4, 6)).toBe(48);
    });

    test('returns 0 for no work', () => {
      expect(calculateHoursPerFortnight(0, 0)).toBe(0);
    });

    test('throws error for negative days', () => {
      expect(() => calculateHoursPerFortnight(-1, 8)).toThrow('Days per week must be between 0 and 7');
    });

    test('throws error for days > 7', () => {
      expect(() => calculateHoursPerFortnight(8, 8)).toThrow('Days per week must be between 0 and 7');
    });

    test('throws error for negative hours', () => {
      expect(() => calculateHoursPerFortnight(5, -1)).toThrow('Hours per day must be between 0 and 24');
    });

    test('throws error for hours > 24', () => {
      expect(() => calculateHoursPerFortnight(5, 25)).toThrow('Hours per day must be between 0 and 24');
    });
  });

  describe('determineApplicableHours', () => {
    test('applies subsidised hours when less than actual', () => {
      const result = determineApplicableHours(36, 45);
      expect(result.appliedHours).toBe(36);
      expect(result.reason).toBe('Limited by subsidised hours cap');
      expect(result.subsidisedHours).toBe(36);
      expect(result.actualHours).toBe(45);
    });

    test('applies actual hours when less than subsidised', () => {
      const result = determineApplicableHours(50, 30);
      expect(result.appliedHours).toBe(30);
      expect(result.reason).toBe('Limited by actual childcare hours needed');
      expect(result.subsidisedHours).toBe(50);
      expect(result.actualHours).toBe(30);
    });

    test('applies equal hours when subsidised equals actual', () => {
      const result = determineApplicableHours(40, 40);
      expect(result.appliedHours).toBe(40);
      expect(result.reason).toBe('Subsidised hours equals actual hours needed');
    });

    test('handles zero subsidised hours', () => {
      const result = determineApplicableHours(0, 40);
      expect(result.appliedHours).toBe(0);
    });

    test('handles zero actual hours', () => {
      const result = determineApplicableHours(40, 0);
      expect(result.appliedHours).toBe(0);
    });

    test('throws error for negative subsidised hours', () => {
      expect(() => determineApplicableHours(-10, 40))
        .toThrow('Subsidised hours must be a non-negative number');
    });

    test('throws error for negative actual hours', () => {
      expect(() => determineApplicableHours(40, -10))
        .toThrow('Actual hours must be a non-negative number');
    });
  });

  describe('ACTIVITY_TEST_CONSTANTS', () => {
    test('exports correct base hours per fortnight', () => {
      expect(ACTIVITY_TEST_CONSTANTS.BASE_HOURS_PER_FORTNIGHT).toBe(72);
    });

    test('exports correct base hours per week', () => {
      expect(ACTIVITY_TEST_CONSTANTS.BASE_HOURS_PER_WEEK).toBe(36);
    });

    test('exports correct higher hours per fortnight', () => {
      expect(ACTIVITY_TEST_CONSTANTS.HIGHER_HOURS_PER_FORTNIGHT).toBe(100);
    });

    test('exports correct higher hours per week', () => {
      expect(ACTIVITY_TEST_CONSTANTS.HIGHER_HOURS_PER_WEEK).toBe(50);
    });

    test('exports correct higher activity threshold', () => {
      expect(ACTIVITY_TEST_CONSTANTS.HIGHER_ACTIVITY_THRESHOLD).toBe(48);
    });
  });
});
