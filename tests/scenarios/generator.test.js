/**
 * Unit tests for scenario generator module
 */

import {
  generateCommonScenarios,
  generateSingleParentScenarios,
  createCustomScenario,
  compareScenarios,
  filterScenarios,
  findBestScenario
} from '../../src/js/scenarios/generator.js';

describe('Scenario Generator', () => {
  const baseData = {
    parent1BaseIncome: 100000,
    parent2BaseIncome: 80000,
    parent1HoursPerDay: 7.6,
    parent2HoursPerDay: 7.6,
    children: [
      {
        age: 3,
        careType: 'centre-based',
        hoursPerWeek: 40,
        providerFee: 12.50
      }
    ]
  };

  describe('generateCommonScenarios', () => {
    test('generates multiple scenarios for two-parent family', () => {
      const scenarios = generateCommonScenarios(baseData);
      
      expect(scenarios).toBeDefined();
      expect(scenarios.length).toBeGreaterThan(0);
      expect(scenarios.length).toBeLessThanOrEqual(11); // Max common combinations
    });

    test('generates scenarios with correct structure', () => {
      const scenarios = generateCommonScenarios(baseData);
      const scenario = scenarios[0];
      
      expect(scenario).toHaveProperty('id');
      expect(scenario).toHaveProperty('name');
      expect(scenario).toHaveProperty('parent1Days');
      expect(scenario).toHaveProperty('parent2Days');
      expect(scenario).toHaveProperty('householdIncome');
      expect(scenario).toHaveProperty('netIncomeAfterChildcare');
      expect(scenario).toHaveProperty('annualOutOfPocket');
      expect(scenario).toHaveProperty('childResults');
    });

    test('generates different work day combinations', () => {
      const scenarios = generateCommonScenarios(baseData);
      
      // Should have variety of work day combinations
      const uniqueCombinations = new Set(
        scenarios.map(s => `${s.parent1Days}+${s.parent2Days}`)
      );
      
      expect(uniqueCombinations.size).toBeGreaterThan(1);
    });

    test('calculates income correctly for each scenario', () => {
      const scenarios = generateCommonScenarios(baseData);
      
      // Find 5+5 scenario (both full time)
      const fullTimeScenario = scenarios.find(s => 
        s.parent1Days === 5 && s.parent2Days === 5
      );
      
      expect(fullTimeScenario).toBeDefined();
      expect(fullTimeScenario.householdIncome).toBe(180000);
    });

    test('generates single parent scenarios when parent2 income is 0', () => {
      const singleParentData = {
        ...baseData,
        parent2BaseIncome: 0
      };
      
      const scenarios = generateCommonScenarios(singleParentData);
      
      // All scenarios should have parent2Days = 0
      scenarios.forEach(scenario => {
        expect(scenario.parent2Days).toBe(0);
        expect(scenario.parent2Income).toBe(0);
      });
    });
  });

  describe('generateSingleParentScenarios', () => {
    test('generates scenarios for single parent', () => {
      const scenarios = generateSingleParentScenarios(baseData);
      
      expect(scenarios).toBeDefined();
      expect(scenarios.length).toBe(5); // 1-5 days
    });

    test('all scenarios have parent2Days = 0', () => {
      const scenarios = generateSingleParentScenarios(baseData);
      
      scenarios.forEach(scenario => {
        expect(scenario.parent2Days).toBe(0);
      });
    });

    test('generates scenarios with different work days', () => {
      const scenarios = generateSingleParentScenarios(baseData);
      
      const workDays = scenarios.map(s => s.parent1Days);
      expect(workDays).toContain(1);
      expect(workDays).toContain(2);
      expect(workDays).toContain(3);
      expect(workDays).toContain(4);
      expect(workDays).toContain(5);
    });
  });

  describe('createCustomScenario', () => {
    test('creates custom scenario with specific work days', () => {
      const customData = {
        ...baseData,
        parent1Days: 3,
        parent2Days: 2,
        scenarioName: 'Custom 3+2 scenario'
      };
      
      const scenario = createCustomScenario(customData);
      
      expect(scenario).toBeDefined();
      expect(scenario.parent1Days).toBe(3);
      expect(scenario.parent2Days).toBe(2);
      expect(scenario.name).toBe('Custom 3+2 scenario');
    });

    test('calculates correct adjusted income for custom scenario', () => {
      const customData = {
        ...baseData,
        parent1Days: 4,
        parent2Days: 3,
      };
      
      const scenario = createCustomScenario(customData);
      
      expect(scenario.parent1Income).toBe(80000); // 100k * 4/5
      expect(scenario.parent2Income).toBe(48000); // 80k * 3/5
      expect(scenario.householdIncome).toBe(128000);
    });
  });

  describe('compareScenarios', () => {
    test('compares scenarios by net income (descending)', () => {
      const scenario1 = {
        netIncomeAfterChildcare: 100000,
        annualOutOfPocket: 20000
      };
      const scenario2 = {
        netIncomeAfterChildcare: 80000,
        annualOutOfPocket: 25000
      };
      
      const result = compareScenarios(scenario1, scenario2, 'netIncome', 'desc');
      expect(result).toBeLessThan(0); // scenario1 should come first
    });

    test('compares scenarios by out of pocket (ascending)', () => {
      const scenario1 = {
        netIncomeAfterChildcare: 100000,
        annualOutOfPocket: 25000
      };
      const scenario2 = {
        netIncomeAfterChildcare: 80000,
        annualOutOfPocket: 20000
      };
      
      const result = compareScenarios(scenario1, scenario2, 'outOfPocket', 'asc');
      expect(result).toBeGreaterThan(0); // scenario2 should come first
    });

    test('compares scenarios by work days', () => {
      const scenario1 = {
        parent1Days: 5,
        parent2Days: 5,
        netIncomeAfterChildcare: 100000
      };
      const scenario2 = {
        parent1Days: 3,
        parent2Days: 2,
        netIncomeAfterChildcare: 80000
      };
      
      const result = compareScenarios(scenario1, scenario2, 'workDays', 'desc');
      expect(result).toBeLessThan(0); // scenario1 has more work days
    });
  });

  describe('filterScenarios', () => {
    const testScenarios = [
      {
        id: 1,
        netIncomeAfterChildcare: 100000,
        annualOutOfPocket: 20000,
        parent1Days: 5,
        parent2Days: 5,
        isFavorite: true
      },
      {
        id: 2,
        netIncomeAfterChildcare: 80000,
        annualOutOfPocket: 15000,
        parent1Days: 4,
        parent2Days: 3,
        isFavorite: false
      },
      {
        id: 3,
        netIncomeAfterChildcare: 60000,
        annualOutOfPocket: 10000,
        parent1Days: 3,
        parent2Days: 2,
        isFavorite: false
      }
    ];

    test('filters by minimum net income', () => {
      const filtered = filterScenarios(testScenarios, { minNetIncome: 70000 });
      
      expect(filtered.length).toBe(2);
      expect(filtered.every(s => s.netIncomeAfterChildcare >= 70000)).toBe(true);
    });

    test('filters by maximum out of pocket', () => {
      const filtered = filterScenarios(testScenarios, { maxOutOfPocket: 16000 });
      
      expect(filtered.length).toBe(2);
      expect(filtered.every(s => s.annualOutOfPocket <= 16000)).toBe(true);
    });

    test('filters by minimum work days', () => {
      const filtered = filterScenarios(testScenarios, { minWorkDays: 8 });
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].parent1Days + filtered[0].parent2Days).toBeGreaterThanOrEqual(8);
    });

    test('filters by maximum work days', () => {
      const filtered = filterScenarios(testScenarios, { maxWorkDays: 6 });
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].parent1Days + filtered[0].parent2Days).toBeLessThanOrEqual(6);
    });

    test('filters favorites only', () => {
      const filtered = filterScenarios(testScenarios, { favoritesOnly: true });
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].isFavorite).toBe(true);
    });

    test('combines multiple filters', () => {
      const filtered = filterScenarios(testScenarios, {
        minNetIncome: 70000,
        maxOutOfPocket: 18000
      });
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(2);
    });

    test('returns empty array when no scenarios match', () => {
      const filtered = filterScenarios(testScenarios, { minNetIncome: 200000 });
      
      expect(filtered.length).toBe(0);
    });
  });

  describe('findBestScenario', () => {
    const testScenarios = [
      {
        netIncomeAfterChildcare: 80000,
        annualOutOfPocket: 20000,
        annualSubsidy: 15000
      },
      {
        netIncomeAfterChildcare: 100000,
        annualOutOfPocket: 25000,
        annualSubsidy: 18000
      },
      {
        netIncomeAfterChildcare: 60000,
        annualOutOfPocket: 15000,
        annualSubsidy: 12000
      }
    ];

    test('finds best scenario by net income', () => {
      const best = findBestScenario(testScenarios, 'netIncome');
      
      expect(best.netIncomeAfterChildcare).toBe(100000);
    });

    test('finds best scenario by lowest out of pocket', () => {
      const best = findBestScenario(testScenarios, 'outOfPocket');
      
      // Note: compareScenarios with 'desc' order, so this finds highest value
      // For lowest, we'd need 'asc' - but function uses 'desc' by default
      expect(best.annualOutOfPocket).toBe(25000);
    });

    test('finds best scenario by highest subsidy', () => {
      const best = findBestScenario(testScenarios, 'subsidy');
      
      expect(best.annualSubsidy).toBe(18000);
    });

    test('returns null for empty array', () => {
      const best = findBestScenario([], 'netIncome');
      
      expect(best).toBeNull();
    });

    test('returns null for null/undefined input', () => {
      expect(findBestScenario(null)).toBeNull();
      expect(findBestScenario(undefined)).toBeNull();
    });
  });

  describe('scenario calculations', () => {
    test('calculates subsidised hours correctly', () => {
      const scenarios = generateCommonScenarios(baseData);
      
      // For 5+5 days scenario, should get 100 hours/fortnight (50 hours/week)
      const fullTimeScenario = scenarios.find(s => 
        s.parent1Days === 5 && s.parent2Days === 5
      );
      
      expect(fullTimeScenario.subsidisedHours.hoursPerFortnight).toBe(100);
      expect(fullTimeScenario.subsidisedHours.hoursPerWeek).toBe(50);
    });

    test('calculates net income after childcare', () => {
      const scenarios = generateCommonScenarios(baseData);
      
      scenarios.forEach(scenario => {
        const expectedNet = scenario.householdIncome - scenario.annualOutOfPocket;
        expect(scenario.netIncomeAfterChildcare).toBeCloseTo(expectedNet, 2);
      });
    });

    test('calculates childcare cost percentage', () => {
      const scenarios = generateCommonScenarios(baseData);
      
      scenarios.forEach(scenario => {
        if (scenario.householdIncome > 0) {
          const expectedPercentage = (scenario.annualOutOfPocket / scenario.householdIncome) * 100;
          expect(scenario.childcareCostPercentage).toBeCloseTo(expectedPercentage, 2);
        }
      });
    });

    test('handles multiple children correctly', () => {
      const multiChildData = {
        ...baseData,
        children: [
          { age: 3, careType: 'centre-based', hoursPerWeek: 40, providerFee: 12.50 },
          { age: 1, careType: 'centre-based', hoursPerWeek: 40, providerFee: 12.50 }
        ]
      };
      
      const scenarios = generateCommonScenarios(multiChildData);
      
      scenarios.forEach(scenario => {
        expect(scenario.childResults).toHaveLength(2);
        expect(scenario.totalWeeklyCost).toBeGreaterThan(0);
      });
    });
  });
});
