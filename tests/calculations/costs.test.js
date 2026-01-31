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
  applyWithholding,
  CARE_TYPES,
  AGE_CATEGORIES,
  WITHHOLDING
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
      
      // Gross subsidy: 13.17 * 35 = 460.95
      // 5% withholding: 23.05
      // Paid subsidy: 437.90
      expect(result.weeklyGrossSubsidy).toBeCloseTo(460.95, 2);
      expect(result.weeklyWithheld).toBeCloseTo(23.05, 2);
      expect(result.weeklySubsidy).toBeCloseTo(437.90, 2);
      expect(result.weeklyFullCost).toBe(525);
      expect(result.weeklyOutOfPocket).toBeCloseTo(87.10, 2);
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
      
      // Gross subsidy: 13.17 * 36 = 474.12
      // 5% withholding: 23.71
      // Paid subsidy: 450.41
      expect(result.weeklyGrossSubsidy).toBeCloseTo(474.12, 2);
      expect(result.weeklyWithheld).toBeCloseTo(23.71, 2);
      expect(result.weeklySubsidy).toBeCloseTo(450.41, 2);
      expect(result.weeklyFullCost).toBe(675);
      expect(result.weeklyOutOfPocket).toBeCloseTo(224.59, 2);
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
      
      // Effective rate: min(15, 14.63) = 14.63
      // Subsidy per hour: 0.9 * 14.63 = 13.167
      // Weekly gross subsidy: 13.167 * 36 = 474.01
      // Weekly withholding (5%): 23.70
      // Weekly paid subsidy: 450.31
      // Out of pocket: 600 - 450.31 = 149.69
      expect(result.effectiveHourlyRate).toBe(14.63);
      expect(result.subsidyPerHour).toBeCloseTo(13.167, 2);
      expect(result.weekly.weeklyGrossSubsidy).toBeCloseTo(474.01, 1);
      expect(result.weekly.weeklyWithheld).toBeCloseTo(23.70, 1);
      expect(result.weekly.weeklySubsidy).toBeCloseTo(450.31, 1);
      expect(result.weekly.weeklyFullCost).toBe(600);
      expect(result.weekly.weeklyOutOfPocket).toBeCloseTo(149.69, 1);
      expect(result.annual.outOfPocket).toBeCloseTo(7783.88, 1);
      expect(result.netIncome).toBeCloseTo(92216.12, 1);
      expect(result.costPercentage).toBeCloseTo(7.78, 1);
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

  describe('WITHHOLDING export', () => {
    test('exports withholding constants', () => {
      expect(WITHHOLDING.DEFAULT_RATE).toBe(5);
      expect(WITHHOLDING.MIN_RATE).toBe(0);
      expect(WITHHOLDING.MAX_RATE).toBe(100);
    });
  });

  describe('applyWithholding', () => {
    test('applies default 5% withholding correctly', () => {
      const result = applyWithholding(100);
      expect(result.grossSubsidy).toBe(100);
      expect(result.withheldAmount).toBe(5);
      expect(result.paidSubsidy).toBe(95);
      expect(result.withholdingRate).toBe(5);
    });

    test('applies 0% withholding (opt-out)', () => {
      const result = applyWithholding(100, 0);
      expect(result.grossSubsidy).toBe(100);
      expect(result.withheldAmount).toBe(0);
      expect(result.paidSubsidy).toBe(100);
      expect(result.withholdingRate).toBe(0);
    });

    test('applies 10% withholding', () => {
      const result = applyWithholding(200, 10);
      expect(result.grossSubsidy).toBe(200);
      expect(result.withheldAmount).toBe(20);
      expect(result.paidSubsidy).toBe(180);
      expect(result.withholdingRate).toBe(10);
    });

    test('applies 100% withholding', () => {
      const result = applyWithholding(150, 100);
      expect(result.grossSubsidy).toBe(150);
      expect(result.withheldAmount).toBe(150);
      expect(result.paidSubsidy).toBe(0);
      expect(result.withholdingRate).toBe(100);
    });

    test('rounds monetary values to 2 decimal places', () => {
      const result = applyWithholding(100.555, 5);
      expect(result.grossSubsidy).toBe(100.56);
      expect(result.withheldAmount).toBe(5.03);
      expect(result.paidSubsidy).toBe(95.53);
    });

    test('handles zero subsidy amount', () => {
      const result = applyWithholding(0, 5);
      expect(result.grossSubsidy).toBe(0);
      expect(result.withheldAmount).toBe(0);
      expect(result.paidSubsidy).toBe(0);
    });

    test('throws error for negative subsidy amount', () => {
      expect(() => applyWithholding(-100, 5))
        .toThrow('Subsidy amount must be a non-negative number');
    });

    test('throws error for withholding rate below 0', () => {
      expect(() => applyWithholding(100, -1))
        .toThrow('Withholding rate must be between 0 and 100');
    });

    test('throws error for withholding rate above 100', () => {
      expect(() => applyWithholding(100, 101))
        .toThrow('Withholding rate must be between 0 and 100');
    });

    test('throws error for non-numeric subsidy amount', () => {
      expect(() => applyWithholding('100', 5))
        .toThrow('Subsidy amount must be a non-negative number');
    });

    test('throws error for non-numeric withholding rate', () => {
      expect(() => applyWithholding(100, '5'))
        .toThrow('Withholding rate must be between 0 and 100');
    });
  });

  describe('calculateWeeklyCosts with withholding', () => {
    test('includes withholding in weekly costs with default rate', () => {
      const result = calculateWeeklyCosts({
        subsidyPerHour: 10,
        providerFee: 15,
        subsidisedHours: 40,
        actualHours: 40
      });
      
      // Gross subsidy: 10 * 40 = 400
      // 5% withholding: 20
      // Paid subsidy: 380
      // Full cost: 15 * 40 = 600
      // Out of pocket: 600 - 380 = 220
      expect(result.weeklyGrossSubsidy).toBe(400);
      expect(result.weeklyWithheld).toBe(20);
      expect(result.weeklySubsidy).toBe(380);
      expect(result.weeklyFullCost).toBe(600);
      expect(result.weeklyOutOfPocket).toBe(220);
      expect(result.withholdingRate).toBe(5);
    });

    test('includes withholding with custom 0% rate', () => {
      const result = calculateWeeklyCosts({
        subsidyPerHour: 10,
        providerFee: 15,
        subsidisedHours: 40,
        actualHours: 40,
        withholdingRate: 0
      });
      
      expect(result.weeklyGrossSubsidy).toBe(400);
      expect(result.weeklyWithheld).toBe(0);
      expect(result.weeklySubsidy).toBe(400);
      expect(result.weeklyFullCost).toBe(600);
      expect(result.weeklyOutOfPocket).toBe(200);
      expect(result.withholdingRate).toBe(0);
    });

    test('includes withholding with custom 10% rate', () => {
      const result = calculateWeeklyCosts({
        subsidyPerHour: 10,
        providerFee: 15,
        subsidisedHours: 40,
        actualHours: 40,
        withholdingRate: 10
      });
      
      // Gross subsidy: 400
      // 10% withholding: 40
      // Paid subsidy: 360
      expect(result.weeklyGrossSubsidy).toBe(400);
      expect(result.weeklyWithheld).toBe(40);
      expect(result.weeklySubsidy).toBe(360);
      expect(result.weeklyOutOfPocket).toBe(240);
      expect(result.withholdingRate).toBe(10);
    });
  });

  describe('calculateCompleteCostBreakdown with withholding', () => {
    test('includes withholding in complete breakdown with default rate', () => {
      const result = calculateCompleteCostBreakdown({
        householdIncome: 100000,
        subsidyRate: 90,
        providerFee: 15,
        careType: CARE_TYPES.CENTRE_BASED,
        childAge: 3,
        subsidisedHours: 40,
        actualHours: 40
      });

      // Effective rate: min(15, 14.63) = 14.63
      // Subsidy per hour: 0.9 * 14.63 = 13.167
      // Weekly gross subsidy: 13.167 * 40 = 526.68
      // Weekly withholding: 526.68 * 0.05 = 26.33
      // Weekly paid subsidy: 500.35
      // Annual gross subsidy: 526.68 * 52 = 27,387.36
      // Annual paid subsidy: 500.35 * 52 = 26,018.20
      
      expect(result.withholdingRate).toBe(5);
      expect(result.weekly.weeklyGrossSubsidy).toBeCloseTo(526.68, 1);
      expect(result.weekly.weeklyWithheld).toBeCloseTo(26.33, 1);
      expect(result.weekly.weeklySubsidy).toBeCloseTo(500.35, 1);
      expect(result.annual.grossSubsidy).toBeCloseTo(27387.36, 0);
      expect(result.annual.withheld).toBeCloseTo(1369.16, 0);
      expect(result.annual.subsidy).toBeCloseTo(26018.20, 0);
    });

    test('includes withholding in complete breakdown with 0% rate', () => {
      const result = calculateCompleteCostBreakdown({
        householdIncome: 100000,
        subsidyRate: 90,
        providerFee: 15,
        careType: CARE_TYPES.CENTRE_BASED,
        childAge: 3,
        subsidisedHours: 40,
        actualHours: 40,
        withholdingRate: 0
      });

      expect(result.withholdingRate).toBe(0);
      expect(result.weekly.weeklyWithheld).toBe(0);
      expect(result.weekly.weeklySubsidy).toBe(result.weekly.weeklyGrossSubsidy);
      expect(result.annual.withheld).toBe(0);
      expect(result.annual.subsidy).toBe(result.annual.grossSubsidy);
    });

    test('includes withholding in complete breakdown with custom 10% rate', () => {
      const result = calculateCompleteCostBreakdown({
        householdIncome: 100000,
        subsidyRate: 90,
        providerFee: 15,
        careType: CARE_TYPES.CENTRE_BASED,
        childAge: 3,
        subsidisedHours: 40,
        actualHours: 40,
        withholdingRate: 10
      });

      expect(result.withholdingRate).toBe(10);
      // Weekly withholding should be 10% of gross subsidy
      const expectedWithheld = result.weekly.weeklyGrossSubsidy * 0.1;
      expect(result.weekly.weeklyWithheld).toBeCloseTo(expectedWithheld, 1);
    });
  });
});
