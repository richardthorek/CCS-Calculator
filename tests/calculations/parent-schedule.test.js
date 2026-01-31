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
      
      expect(result.daysCount).toBe(5);
      expect(result.overlappingDays).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    });
    
    test('should calculate minimum childcare days for different parent schedules', () => {
      // Parent 1: Mon-Thu, Parent 2: Tue-Fri
      // Childcare needed: Mon-Fri (5 days)
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday', 'thursday'],
        ['tuesday', 'wednesday', 'thursday', 'friday']
      );
      
      expect(result.daysCount).toBe(5);
      expect(result.childcareDays).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
      expect(result.overlappingDays).toEqual(['tuesday', 'wednesday', 'thursday']);
      expect(result.parent1OnlyDays).toEqual(['monday']);
      expect(result.parent2OnlyDays).toEqual(['friday']);
    });
    
    test('should calculate minimum when parents work completely different days', () => {
      // Parent 1: Mon, Wed, Fri; Parent 2: Tue, Thu
      const result = calculateMinimumChildcareDays(
        ['monday', 'wednesday', 'friday'],
        ['tuesday', 'thursday']
      );
      
      expect(result.daysCount).toBe(5);
      expect(result.childcareDays).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
      expect(result.overlappingDays).toEqual([]);
    });
    
    test('should identify days without care', () => {
      // Parent 1: Mon-Wed, Parent 2: none
      const result = calculateMinimumChildcareDays(
        ['monday', 'tuesday', 'wednesday'],
        []
      );
      
      expect(result.daysWithoutCare).toEqual(['thursday', 'friday']);
    });
    
    test('should handle no work days', () => {
      const result = calculateMinimumChildcareDays([], []);
      
      expect(result.daysCount).toBe(0);
      expect(result.childcareDays).toEqual([]);
    });
    
    test('should sort childcare days in correct order', () => {
      const result = calculateMinimumChildcareDays(
        ['friday', 'monday'],
        ['wednesday']
      );
      
      expect(result.childcareDays).toEqual(['monday', 'wednesday', 'friday']);
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
      const scheduleResult = {
        parent1WorkDays: ['monday', 'tuesday', 'wednesday'],
        parent2WorkDays: ['tuesday', 'wednesday', 'thursday'],
        childcareDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
        daysWithoutCare: ['friday'],
        overlappingDays: ['tuesday', 'wednesday'],
        parent1OnlyDays: ['monday'],
        parent2OnlyDays: ['thursday'],
        explanation: 'Test explanation'
      };
      
      const result = formatScheduleBreakdown(scheduleResult);
      
      expect(result.parent1Days).toBe('Monday, Tuesday, Wednesday');
      expect(result.parent2Days).toBe('Tuesday, Wednesday, Thursday');
      expect(result.childcareDays).toBe('Monday, Tuesday, Wednesday, Thursday');
      expect(result.daysWithoutCare).toBe('Friday');
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
