/**
 * Unit tests for cost calculation module
 */

import {
  calculateEffectiveHourlyRate,
  calculateSubsidyPerHour,
  calculateWeeklyCosts,
  calculateAnnualCost,
  calculateNetIncome,
  calculateCostAsPercentageOfIncome,
  calculateCompleteCostBreakdown,
  CARE_TYPES,
  AGE_CATEGORIES
} from '../../src/js/calculations/costs.js';

describe('Cost Calculations', () => {
  describe('calculateEffectiveHourlyRate', () => {
    test('uses provider fee when below rate cap', () => {
      const result = calculateEffectiveHourlyRate(12.00, CARE_TYPES.CENTRE_BASED, 3);
      expect(result).toBe(12.00);
    });

    test('uses rate cap when provider fee exceeds cap', () => {
      const result = calculateEffectiveHourlyRate(20.00, CARE_TYPES.CENTRE_BASED, 3);
      expect(result).toBe(14.63); // Non-school age centre-based cap
    });

    test('uses correct cap for school-age child', () => {
      const result = calculateEffectiveHourlyRate(20.00, CARE_TYPES.CENTRE_BASED, 8);
      expect(result).toBe(12.81); // School age centre-based cap
    });

    test('uses correct cap for family day care', () => {
      const result = calculateEffectiveHourlyRate(20.00, CARE_TYPES.FAMILY_DAY_CARE, 3);
      expect(result).toBe(13.56);
    });

    test('uses correct cap for in-home care', () => {
      const result = calculateEffectiveHourlyRate(50.00, CARE_TYPES.IN_HOME_CARE, 3);
      expect(result).toBe(39.80);
    });

    test('handles provider fee exactly at cap', () => {
      const result = calculateEffectiveHourlyRate(14.63, CARE_TYPES.CENTRE_BASED, 3);
      expect(result).toBe(14.63);
    });

    test('throws error for negative provider fee', () => {
      expect(() => calculateEffectiveHourlyRate(-10, CARE_TYPES.CENTRE_BASED, 3))
        .toThrow('Provider fee must be a non-negative number');
    });

    test('throws error for invalid child age', () => {
      expect(() => calculateEffectiveHourlyRate(15, CARE_TYPES.CENTRE_BASED, -1))
        .toThrow('Child age must be between 0 and 18');
    });

    test('throws error for invalid care type', () => {
      expect(() => calculateEffectiveHourlyRate(15, 'invalid-type', 3))
        .toThrow('Invalid care type');
    });
  });

  describe('calculateSubsidyPerHour', () => {
    test('calculates 90% subsidy correctly', () => {
      const result = calculateSubsidyPerHour(90, 14.63);
      expect(result).toBeCloseTo(13.167, 2);
    });

    test('calculates 50% subsidy correctly', () => {
      const result = calculateSubsidyPerHour(50, 14.63);
      expect(result).toBeCloseTo(7.315, 2);
    });

    test('calculates 0% subsidy correctly', () => {
      const result = calculateSubsidyPerHour(0, 14.63);
      expect(result).toBe(0);
    });

    test('calculates 100% subsidy correctly', () => {
      const result = calculateSubsidyPerHour(100, 14.63);
      expect(result).toBe(14.63);
    });

    test('throws error for negative subsidy rate', () => {
      expect(() => calculateSubsidyPerHour(-10, 14.63))
        .toThrow('Subsidy rate must be between 0 and 100');
    });

    test('throws error for subsidy rate > 100', () => {
      expect(() => calculateSubsidyPerHour(110, 14.63))
        .toThrow('Subsidy rate must be between 0 and 100');
    });

    test('throws error for negative effective rate', () => {
      expect(() => calculateSubsidyPerHour(90, -10))
        .toThrow('Effective hourly rate must be a non-negative number');
    });
  });

  describe('calculateWeeklyCosts', () => {
    test('calculates costs when subsidised hours covers all actual hours', () => {
      const result = calculateWeeklyCosts({
        subsidyPerHour: 13.17,
        providerFee: 15.00,
        subsidisedHours: 40,
        actualHours: 35
      });
      
      expect(result.weeklySubsidy).toBeCloseTo(460.95, 2);
      expect(result.weeklyFullCost).toBe(525);
      expect(result.weeklyOutOfPocket).toBeCloseTo(64.05, 2);
      expect(result.hoursWithSubsidy).toBe(35);
      expect(result.hoursWithoutSubsidy).toBe(0);
    });

    test('calculates costs when actual hours exceed subsidised hours', () => {
      const result = calculateWeeklyCosts({
        subsidyPerHour: 13.17,
        providerFee: 15.00,
        subsidisedHours: 36,
        actualHours: 45
      });
      
      expect(result.weeklySubsidy).toBeCloseTo(474.12, 2);
      expect(result.weeklyFullCost).toBe(675);
      expect(result.weeklyOutOfPocket).toBeCloseTo(200.88, 2);
      expect(result.hoursWithSubsidy).toBe(36);
      expect(result.hoursWithoutSubsidy).toBe(9);
    });

    test('handles zero subsidy', () => {
      const result = calculateWeeklyCosts({
        subsidyPerHour: 0,
        providerFee: 15.00,
        subsidisedHours: 36,
        actualHours: 40
      });
      
      expect(result.weeklySubsidy).toBe(0);
      expect(result.weeklyFullCost).toBe(600);
      expect(result.weeklyOutOfPocket).toBe(600);
    });

    test('handles zero actual hours', () => {
      const result = calculateWeeklyCosts({
        subsidyPerHour: 13.17,
        providerFee: 15.00,
        subsidisedHours: 36,
        actualHours: 0
      });
      
      expect(result.weeklySubsidy).toBe(0);
      expect(result.weeklyFullCost).toBe(0);
      expect(result.weeklyOutOfPocket).toBe(0);
    });

    test('throws error for negative subsidy per hour', () => {
      expect(() => calculateWeeklyCosts({
        subsidyPerHour: -10,
        providerFee: 15,
        subsidisedHours: 36,
        actualHours: 40
      })).toThrow('Subsidy per hour must be a non-negative number');
    });

    test('throws error for missing parameters', () => {
      expect(() => calculateWeeklyCosts({
        subsidyPerHour: 13.17,
        providerFee: 15.00
      })).toThrow();
    });
  });

  describe('calculateAnnualCost', () => {
    test('calculates annual cost for 52 weeks', () => {
      expect(calculateAnnualCost(100)).toBe(5200);
    });

    test('calculates annual cost for custom weeks', () => {
      expect(calculateAnnualCost(100, 48)).toBe(4800);
    });

    test('handles zero weekly cost', () => {
      expect(calculateAnnualCost(0)).toBe(0);
    });

    test('rounds to 2 decimal places', () => {
      expect(calculateAnnualCost(64.05)).toBe(3330.6);
    });

    test('throws error for negative weekly cost', () => {
      expect(() => calculateAnnualCost(-100)).toThrow('Weekly cost must be a non-negative number');
    });

    test('throws error for invalid weeks per year', () => {
      expect(() => calculateAnnualCost(100, 0)).toThrow('Weeks per year must be a positive number');
    });
  });

  describe('calculateNetIncome', () => {
    test('calculates net income correctly', () => {
      expect(calculateNetIncome(100000, 15000)).toBe(85000);
    });

    test('returns 0 when childcare cost exceeds income', () => {
      expect(calculateNetIncome(50000, 60000)).toBe(0);
    });

    test('handles zero childcare cost', () => {
      expect(calculateNetIncome(100000, 0)).toBe(100000);
    });

    test('handles zero income', () => {
      expect(calculateNetIncome(0, 5000)).toBe(0);
    });

    test('throws error for negative income', () => {
      expect(() => calculateNetIncome(-50000, 15000))
        .toThrow('Household income must be a non-negative number');
    });

    test('throws error for negative childcare cost', () => {
      expect(() => calculateNetIncome(100000, -5000))
        .toThrow('Annual childcare cost must be a non-negative number');
    });
  });

  describe('calculateCostAsPercentageOfIncome', () => {
    test('calculates percentage correctly', () => {
      expect(calculateCostAsPercentageOfIncome(15000, 100000)).toBe(15);
    });

    test('handles cost greater than income', () => {
      const result = calculateCostAsPercentageOfIncome(60000, 50000);
      expect(result).toBe(120);
    });

    test('returns 0 for zero income', () => {
      expect(calculateCostAsPercentageOfIncome(5000, 0)).toBe(0);
    });

    test('returns 0 for zero cost', () => {
      expect(calculateCostAsPercentageOfIncome(0, 100000)).toBe(0);
    });

    test('rounds to 2 decimal places', () => {
      const result = calculateCostAsPercentageOfIncome(15333, 100000);
      expect(result).toBe(15.33);
    });

    test('throws error for negative cost', () => {
      expect(() => calculateCostAsPercentageOfIncome(-5000, 100000))
        .toThrow('Annual childcare cost must be a non-negative number');
    });

    test('throws error for negative income', () => {
      expect(() => calculateCostAsPercentageOfIncome(5000, -100000))
        .toThrow('Household income must be a non-negative number');
    });
  });

  describe('calculateCompleteCostBreakdown', () => {
    test('calculates complete breakdown for typical scenario', () => {
      const result = calculateCompleteCostBreakdown({
        householdIncome: 100000,
        subsidyRate: 90,
        providerFee: 15.00,
        careType: CARE_TYPES.CENTRE_BASED,
        childAge: 3,
        subsidisedHours: 36,
        actualHours: 40
      });
      
      // Verify structure exists
      expect(result).toBeDefined();
      expect(result.annual).toBeDefined();
      expect(result.annual.outOfPocket).toBeDefined();
      
      expect(result.effectiveHourlyRate).toBe(14.63);
      expect(result.subsidyPerHour).toBeCloseTo(13.167, 2);
      expect(result.weekly.weeklySubsidy).toBeCloseTo(474.01, 1);
      expect(result.weekly.weeklyFullCost).toBe(600);
      expect(result.weekly.weeklyOutOfPocket).toBeCloseTo(125.99, 1);
      expect(result.annual.outOfPocket).toBeCloseTo(6551.48, 1);
      expect(result.netIncome).toBeCloseTo(93448.52, 1);
      expect(result.costPercentage).toBeCloseTo(6.55, 1);
    });

    test('handles provider fee below cap', () => {
      const result = calculateCompleteCostBreakdown({
        householdIncome: 80000,
        subsidyRate: 85,
        providerFee: 12.00,
        careType: CARE_TYPES.CENTRE_BASED,
        childAge: 4,
        subsidisedHours: 36,
        actualHours: 36
      });
      
      expect(result.effectiveHourlyRate).toBe(12.00);
      expect(result.subsidyPerHour).toBeCloseTo(10.2, 2);
    });

    test('handles school-age child', () => {
      const result = calculateCompleteCostBreakdown({
        householdIncome: 100000,
        subsidyRate: 50,
        providerFee: 15.00,
        careType: CARE_TYPES.OSHC,
        childAge: 8,
        subsidisedHours: 36,
        actualHours: 20
      });
      
      expect(result.effectiveHourlyRate).toBe(12.81); // School age cap
    });

    test('handles zero subsidy rate', () => {
      const result = calculateCompleteCostBreakdown({
        householdIncome: 600000,
        subsidyRate: 0,
        providerFee: 15.00,
        careType: CARE_TYPES.CENTRE_BASED,
        childAge: 3,
        subsidisedHours: 36,
        actualHours: 40
      });
      
      expect(result.subsidyPerHour).toBe(0);
      expect(result.weekly.weeklySubsidy).toBe(0);
      expect(result.weekly.weeklyOutOfPocket).toBe(600);
    });
  });

  describe('CARE_TYPES export', () => {
    test('exports care type constants', () => {
      expect(CARE_TYPES.CENTRE_BASED).toBe('centre-based');
      expect(CARE_TYPES.FAMILY_DAY_CARE).toBe('family-day-care');
      expect(CARE_TYPES.OSHC).toBe('oshc');
      expect(CARE_TYPES.IN_HOME_CARE).toBe('in-home-care');
    });
  });

  describe('AGE_CATEGORIES export', () => {
    test('exports age category constants', () => {
      expect(AGE_CATEGORIES.SCHOOL_AGE_THRESHOLD).toBe(6);
      expect(AGE_CATEGORIES.HIGHER_RATE_AGE_THRESHOLD).toBe(5);
    });
  });
});
