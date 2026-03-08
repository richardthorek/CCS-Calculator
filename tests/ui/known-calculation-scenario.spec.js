import { test, expect } from '@playwright/test';
import { knownCalculationScenario } from '../fixtures/known-calculation-scenario.js';

test('UI displays the same result as known calculation scenario baseline', async ({ page }) => {
  const { input, expected } = knownCalculationScenario;

  await page.goto('/');

  await page.locator('#parent1-income').fill(String(input.parent1.annualIncomeFte));
  await page.locator('#parent1-days').fill(String(input.parent1.daysPerWeek));
  await page.locator('#parent1-hours').fill(String(input.parent1.hoursPerDay));

  await page.locator('#parent2-income').fill(String(input.parent2.annualIncomeFte));
  await page.locator('#parent2-days').fill(String(input.parent2.daysPerWeek));
  await page.locator('#parent2-hours').fill(String(input.parent2.hoursPerDay));

  await page.locator('#child-0-age').fill(String(input.child.age));
  await page.locator('#child-0-daily-fee').fill(String(input.child.dailyFee));
  await page.locator('#child-0-hours-per-day').fill(String(input.child.hoursPerDay));
  await page.locator('#child-0-days-of-care').fill(String(input.child.daysOfCare));

  await page.waitForFunction((targetRate) => {
    const ccsRate = document.getElementById('result-ccs-rate')?.textContent?.trim();
    return ccsRate === targetRate;
  }, expected.ui.ccsRate);

  await expect(page.locator('#result-weekly-gap')).toHaveText(expected.ui.weeklyOutOfPocket);
  await expect(page.locator('#result-weekly-subsidy')).toHaveText(expected.ui.weeklySubsidy);
  await expect(page.locator('#result-weekly-cost')).toHaveText(expected.ui.weeklyFullCost);
  await expect(page.locator('#result-ccs-rate')).toHaveText(expected.ui.ccsRate);
  await expect(page.locator('#result-subsidised-hours')).toHaveText(expected.ui.subsidisedHours);
});
