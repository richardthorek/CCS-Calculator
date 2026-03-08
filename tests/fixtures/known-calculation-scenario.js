export const knownCalculationScenario = {
  input: {
    parent1: {
      annualIncomeFte: 100000,
      daysPerWeek: 2,
      hoursPerDay: 8
    },
    parent2: {
      annualIncomeFte: 0,
      daysPerWeek: 0,
      hoursPerDay: 0
    },
    child: {
      age: 3,
      careType: 'centre-based',
      dailyFee: 150,
      hoursPerDay: 10,
      daysOfCare: 4
    },
    withholdingRate: 5
  },
  expected: {
    adjustedIncomeParent1: 40000,
    adjustedIncomeParent2: 0,
    householdIncome: 40000,
    ccsRatePercent: 90,
    subsidisedHoursPerWeek: 36,
    subsidisedDaysPerWeek: 3.5,
    effectiveDailyRate: 146.3,
    subsidyPerDay: 131.67,
    weeklyGrossSubsidy: 460.85,
    weeklyWithheld: 23.04,
    weeklySubsidy: 437.8,
    weeklyFullCost: 600,
    weeklyOutOfPocket: 162.2,
    ui: {
      ccsRate: '90.00%',
      subsidisedHours: '36',
      weeklySubsidy: '$438',
      weeklyFullCost: '$600',
      weeklyOutOfPocket: '$162'
    }
  }
};
