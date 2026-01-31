/**
 * Tests for Parent Schedule Calculation Module
 */

import {
  calculateMinimumChildcareDays,
  convertDaysCountToDayArray,
  calculateCostSavings,
  formatScheduleBreakdown
} from '../../src/js/calculations/parent-schedule.js';

describe('Parent Schedule Calculations', () => {
  describe('calculateMinimumChildcareDays', () => {
    test('should calculate correct childcare days for single parent', () => {
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday'],
        []
      );
      
      expect(result.daysCount).toBe(3);
      expect(result.childcareDays).toEqual(['monday', 'tuesday', 'wednesday']);
      expect(result.parent1WorkDays).toEqual(['monday', 'tuesday', 'wednesday']);
      expect(result.parent2WorkDays).toEqual([]);
      expect(result.overlappingDays).toEqual([]);
    });
    
    test('should calculate correct childcare days for two parents with same schedule', () => {
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      );
      
      // Both parents work all 5 days, so childcare needed all 5 days
      expect(result.daysCount).toBe(5);
      expect(result.overlappingDays).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
      expect(result.childcareDays).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    });
    
    test('should calculate minimum childcare days when one parent is home some days', () => {
      // Parent 1: Mon-Thu (home Fri), Parent 2: Tue-Fri (home Mon)
      // Childcare needed: Tue, Wed, Thu (3 days - when BOTH are working)
      // Monday: Parent 2 is home, Friday: Parent 1 is home
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday', 'thursday'],
        ['tuesday', 'wednesday', 'thursday', 'friday']
      );
      
      expect(result.daysCount).toBe(3);
      expect(result.childcareDays).toEqual(['tuesday', 'wednesday', 'thursday']);
      expect(result.overlappingDays).toEqual(['tuesday', 'wednesday', 'thursday']);
      expect(result.parent1OnlyDays).toEqual(['monday']); // P1 works, P2 home - no care needed
      expect(result.parent2OnlyDays).toEqual(['friday']); // P2 works, P1 home - no care needed
    });
    
    test('should calculate zero childcare days when parents work completely different days', () => {
      // Parent 1: Mon, Wed, Fri; Parent 2: Tue, Thu
      // When one parent works, the other is home - NO childcare needed!
      const result = calculateMinimumChildcareDays(
        ['monday', 'wednesday', 'friday'],
        ['tuesday', 'thursday']
      );
      
      expect(result.daysCount).toBe(0);
      expect(result.childcareDays).toEqual([]);
      expect(result.overlappingDays).toEqual([]);
    });
    
    test('should identify days without care needed (when a parent is home)', () => {
      // Parent 1: Mon-Wed, Parent 2: none (single parent)
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday'],
        []
      );
      
      // Single parent working Mon-Wed, so Thu-Fri no care needed (parent is home)
      expect(result.daysWithoutCare).toEqual(['thursday', 'friday']);
    });
    
    test('should identify all days without care when parents work different days', () => {
      // Parent 1: Mon-Wed, Parent 2: Thu-Fri
      // No overlap - someone is always home!
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday'],
        ['thursday', 'friday']
      );
      
      expect(result.daysCount).toBe(0);
      expect(result.childcareDays).toEqual([]);
      expect(result.daysWithoutCare).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    });
    
    test('should handle no work days', () => {
      const result = calculateMinimumChildcareDays([], []);
      
      expect(result.daysCount).toBe(0);
      expect(result.childcareDays).toEqual([]);
    });
    
    test('should sort childcare days in correct order', () => {
      // Both parents work same days but input in different order
      const result = calculateMinimumChildcareDays(
        ['friday', 'monday', 'wednesday'],
        ['wednesday', 'friday', 'monday']
      );
      
      expect(result.childcareDays).toEqual(['monday', 'wednesday', 'friday']);
    });
    
    test('should handle partial overlap scenario', () => {
      // Parent 1 works Mon-Fri, Parent 2 works Mon-Wed
      // Parent 2 is home Thu-Fri, so care only needed Mon-Wed
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        ['monday', 'tuesday', 'wednesday']
      );
      
      expect(result.daysCount).toBe(3);
      expect(result.childcareDays).toEqual(['monday', 'tuesday', 'wednesday']);
      expect(result.parent1OnlyDays).toEqual(['thursday', 'friday']);
      expect(result.parent2OnlyDays).toEqual([]);
    });
    
    test('should handle typical 4-day work week scenario', () => {
      // Parent 1: Mon-Thu (4 days, not Friday), Parent 2: Mon-Fri (5 days)
      // Parent 1 is home Friday, so care needed Mon-Thu only
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday', 'thursday'],
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      );
      
      expect(result.daysCount).toBe(4);
      expect(result.childcareDays).toEqual(['monday', 'tuesday', 'wednesday', 'thursday']);
      expect(result.daysWithoutCare).toEqual(['friday']); // Parent 1 home
    });
  });
  
  describe('convertDaysCountToDayArray', () => {
    test('should convert 0 days to empty array', () => {
      expect(convertDaysCountToDayArray(0)).toEqual([]);
    });
    
    test('should convert 1 day to Monday', () => {
      expect(convertDaysCountToDayArray(1)).toEqual(['monday']);
    });
    
    test('should convert 3 days to Mon-Wed', () => {
      expect(convertDaysCountToDayArray(3)).toEqual(['monday', 'tuesday', 'wednesday']);
    });
    
    test('should convert 5 days to full week', () => {
      expect(convertDaysCountToDayArray(5)).toEqual([
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
      ]);
    });
    
    test('should throw error for invalid day count', () => {
      expect(() => convertDaysCountToDayArray(-1)).toThrow();
      expect(() => convertDaysCountToDayArray(6)).toThrow();
    });
  });
  
  describe('calculateCostSavings', () => {
    test('should calculate cost savings correctly', () => {
      const result = calculateCostSavings(5, 3, 100);
      
      expect(result.daysWithoutCare).toBe(2);
      expect(result.weeklySavings).toBe(200);
      expect(result.annualSavings).toBe(10400); // 200 * 52
      expect(result.percentageSaved).toBe(40); // 2/5 = 40%
    });
    
    test('should handle no savings', () => {
      const result = calculateCostSavings(5, 5, 100);
      
      expect(result.daysWithoutCare).toBe(0);
      expect(result.weeklySavings).toBe(0);
      expect(result.annualSavings).toBe(0);
      expect(result.percentageSaved).toBe(0);
    });
    
    test('should calculate 100% savings', () => {
      const result = calculateCostSavings(5, 0, 100);
      
      expect(result.daysWithoutCare).toBe(5);
      expect(result.percentageSaved).toBe(100);
    });
    
    test('should throw error for invalid inputs', () => {
      expect(() => calculateCostSavings(-1, 3, 100)).toThrow();
      expect(() => calculateCostSavings(5, -1, 100)).toThrow();
      expect(() => calculateCostSavings(5, 3, -100)).toThrow();
    });
  });
  
  describe('formatScheduleBreakdown', () => {
    test('should format schedule breakdown correctly', () => {
      // Parent 1: Mon-Wed, Parent 2: Tue-Thu
      // Childcare needed: Tue-Wed (overlap)
      const scheduleResult = {
        parent1WorkDays: ['monday', 'tuesday', 'wednesday'],
        parent2WorkDays: ['tuesday', 'wednesday', 'thursday'],
        childcareDays: ['tuesday', 'wednesday'], // Only overlap days
        daysWithoutCare: ['monday', 'thursday', 'friday'], // Days when a parent is home
        overlappingDays: ['tuesday', 'wednesday'],
        parent1OnlyDays: ['monday'], // P1 works, P2 home
        parent2OnlyDays: ['thursday'], // P2 works, P1 home
        explanation: 'Test explanation'
      };
      
      const result = formatScheduleBreakdown(scheduleResult);
      
      expect(result.parent1Days).toBe('Monday, Tuesday, Wednesday');
      expect(result.parent2Days).toBe('Tuesday, Wednesday, Thursday');
      expect(result.childcareDays).toBe('Tuesday, Wednesday');
      expect(result.daysWithoutCare).toBe('Monday, Thursday, Friday');
      expect(result.overlappingDays).toBe('Tuesday, Wednesday');
    });
    
    test('should handle empty arrays', () => {
      const scheduleResult = {
        parent1WorkDays: [],
        parent2WorkDays: [],
        childcareDays: [],
        daysWithoutCare: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        overlappingDays: [],
        parent1OnlyDays: [],
        parent2OnlyDays: [],
        explanation: ''
      };
      
      const result = formatScheduleBreakdown(scheduleResult);
      
      expect(result.parent1Days).toBe('None');
      expect(result.parent2Days).toBe('None');
      expect(result.childcareDays).toBe('None');
    });
  });
});
