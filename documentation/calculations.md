# CCS Calculation Documentation

This document explains the calculation logic for the Child Care Subsidy (CCS) Calculator, based on the 2025-26 financial year policy.

## Table of Contents

1. [Configuration](#configuration)
2. [Income Calculations](#income-calculations)
3. [Subsidy Rate Calculations](#subsidy-rate-calculations)
4. [Activity Test & Subsidised Hours](#activity-test--subsidised-hours)
5. [Cost Calculations](#cost-calculations)
6. [CCS Withholding](#ccs-withholding)
7. [Daily Rate Calculations](#daily-rate-calculations-new-in-2026)
8. [Complete Calculation Flow](#complete-calculation-flow)

## Configuration

All CCS rates, thresholds, and constants are centralized in `/src/js/config/ccs-config.js`. This makes it easy to update values when new financial year rates are published.

### Key Configuration Values (2025-26)

**Income Thresholds:**
- Max 90% subsidy: $85,279
- Taper range: $85,280 - $535,278 (decreases 1% per $5,000)
- Zero subsidy: $535,279+

**Activity Test:**
- Base hours: 72 hours/fortnight (36 hours/week)
- Higher hours: 100 hours/fortnight (50 hours/week) when lower-activity parent works >48 hours/fortnight

**Hourly Rate Caps:**
- Centre-Based (non-school age): $14.63/hour
- Centre-Based (school age): $12.81/hour
- Family Day Care: $13.56/hour
- In-Home Care: $39.80/hour (per family)

## Income Calculations

### Module: `income.js`

#### Adjusted Income Calculation

**Updated 2026-01-31:** Income calculation has been simplified to use only work days per week, providing clean income percentages.

Formula:
```
Adjusted Income = Base Annual Income × (Work Days per Week ÷ 5)
```

**This provides clean income percentages:**
- 1 day/week = 20% of full-time income
- 2 days/week = 40% of full-time income
- 3 days/week = 60% of full-time income
- 4 days/week = 80% of full-time income
- 5 days/week = 100% of full-time income

**Rationale:** The "hours per day" field is still collected for calculating childcare hours needed and activity test requirements, but it no longer affects income calculation. This prevents confusing scenarios where working longer hours on fewer days could result in income exceeding 100% of the base salary.

**Example:**
- Parent earning $100,000/year (full-time equivalent)
- Working 3 days/week
- Adjusted Income = $100,000 × (3 ÷ 5) = $60,000 (exactly 60%)

**Note:** The `calculateAdjustedIncome()` function still accepts `workHoursPerDay` and `fullTimeHours` parameters for backwards compatibility, but these are no longer used in the calculation.

#### Household Income

For two-parent households:
```
Household Income = Parent 1 Adjusted Income + Parent 2 Adjusted Income
```

For combined income without individual breakdown:
- Default: 50/50 split between parents
- Custom: User-defined ratio

## Subsidy Rate Calculations

### Module: `subsidy-rate.js`

#### Standard Rate (Eldest Child ≤5 years)

| Income Range | Subsidy Rate |
|--------------|--------------|
| ≤ $85,279 | 90% |
| $85,280 - $535,278 | 90% minus 1% per $5,000 |
| ≥ $535,279 | 0% |

**Calculation Logic:**
1. If income ≤ $85,279 → return 90%
2. If income ≥ $535,279 → return 0%
3. Otherwise:
   - Calculate: `(income - $85,280) ÷ $5,000` 
   - Round down to get bracket number
   - Subsidy = 90% - (bracket + 1)%

**Example:**
- Income: $100,000
- Above threshold: $100,000 - $85,280 = $14,720
- Bracket: floor($14,720 ÷ $5,000) = 2
- Subsidy: 90% - (2 + 1)% = 87%

#### Higher Rate (Second+ Children ≤5 years)

| Income Range | Subsidy Rate |
|--------------|--------------|
| ≤ $143,273 | 95% |
| $143,274 - $188,272 | 95% minus 1% per $3,000 |
| $188,273 - $267,562 | 80% |
| $267,563 - $357,562 | 80% minus 1% per $3,000 |
| $357,563 - $367,562 | 50% |
| ≥ $367,563 | Reverts to standard rate |

**Child Position Logic:**
- Sort children by age (oldest first)
- First child ≤5 years → standard rate
- Subsequent children ≤5 years → higher rate
- All children >5 years → standard rate

## Activity Test & Subsidised Hours

### Module: `activity-test.js`

#### Subsidised Hours Determination

```
1. Calculate each parent's hours per fortnight
2. Identify lower-activity parent
3. Apply test:
   - If lower-activity parent ≤ 48 hours/fortnight → 72 hours/fortnight (36/week)
   - If lower-activity parent > 48 hours/fortnight → 100 hours/fortnight (50/week)
```

**Example 1 - Base Hours:**
- Parent 1: 5 days × 8 hours = 80 hours/fortnight
- Parent 2: 3 days × 7.6 hours = 45.6 hours/fortnight
- Lower activity: 45.6 hours (≤ 48)
- **Result: 72 hours/fortnight (36/week)**

**Example 2 - Higher Hours:**
- Parent 1: 5 days × 8 hours = 80 hours/fortnight
- Parent 2: 4 days × 7 hours = 56 hours/fortnight
- Lower activity: 56 hours (> 48)
- **Result: 100 hours/fortnight (50/week)**

#### Actual Childcare Hours

Simplified calculation uses maximum of parents' weekly hours:
```
Actual Hours = max(Parent 1 Weekly Hours, Parent 2 Weekly Hours)
```

**Note:** A more sophisticated version would consider specific day/time overlaps.

## Cost Calculations

### Module: `costs.js`

#### Effective Hourly Rate

```
Effective Rate = min(Provider Fee, Rate Cap)
```

Rate cap depends on:
- Care type (Centre-Based, OSHC, Family Day Care, In-Home)
- Child age (school age ≥6 years vs. non-school age)

**Example:**
- Provider fee: $20/hour
- Centre-based, child age 3
- Rate cap: $14.63/hour
- **Effective rate: $14.63/hour**

#### Subsidy Per Hour

```
Subsidy Per Hour = (Subsidy Rate ÷ 100) × Effective Hourly Rate
```

**Example:**
- Subsidy rate: 90%
- Effective rate: $14.63/hour
- **Subsidy: $13.17/hour**

#### Weekly Costs

```
Hours With Subsidy = min(Subsidised Hours, Actual Hours)
Hours Without Subsidy = max(0, Actual Hours - Subsidised Hours)

Weekly Subsidy = Subsidy Per Hour × Hours With Subsidy
Weekly Full Cost = Provider Fee × Actual Hours
Weekly Out-of-Pocket = Weekly Full Cost - Weekly Subsidy
```

**Example:**
- Subsidy per hour: $13.17
- Provider fee: $15/hour
- Subsidised hours: 36
- Actual hours: 40

Calculations:
- Hours with subsidy: min(36, 40) = 36
- Hours without subsidy: max(0, 40 - 36) = 4
- Weekly subsidy: $13.17 × 36 = $474.12
- Weekly full cost: $15 × 40 = $600
- **Weekly out-of-pocket: $600 - $474.12 = $125.88**

#### Annual Costs

```
Annual Cost = Weekly Cost × 52 weeks
```

#### Net Income

```
Net Annual Income = Household Income - Annual Out-of-Pocket Cost
```

#### Cost as Percentage of Income

```
Cost Percentage = (Annual Out-of-Pocket ÷ Household Income) × 100%
```

## CCS Withholding

### Overview

The Australian Government withholds a percentage of the Child Care Subsidy to create a buffer for income fluctuations. This reduces the risk of families incurring a debt when their actual income is reconciled at tax time.

**Source:** Services Australia  
**Default withholding rate:** 5%  
**Adjustable:** Yes, up to 2 times per year via myGov (more via phone)

### Why Withholding Exists

When you claim CCS, Services Australia estimates your subsidy based on your declared income. However, your actual income may vary throughout the year. At the end of the financial year, your CCS entitlement is reconciled against your actual income reported to the ATO.

If you earned more than expected, you may have received too much subsidy and would need to repay the difference. Withholding creates a buffer to reduce or eliminate this debt.

### Withholding Calculation

```
Gross Subsidy = (Subsidy Rate ÷ 100) × Effective Rate × Hours
Withheld Amount = (Withholding Rate ÷ 100) × Gross Subsidy
Paid Subsidy = Gross Subsidy - Withheld Amount
Out-of-Pocket Cost = Full Cost - Paid Subsidy
```

**Example (default 5% withholding):**
- Gross weekly subsidy: $400
- Withholding (5%): $20
- **Paid weekly subsidy: $380**
- Weekly full cost: $600
- **Out-of-pocket: $220**

**Example (0% withholding - opted out):**
- Gross weekly subsidy: $400
- Withholding (0%): $0
- **Paid weekly subsidy: $400**
- Weekly full cost: $600
- **Out-of-pocket: $200**

### Adjusting Withholding

Families can adjust their withholding rate:
- **Online:** Via myGov (Centrelink online account) - up to 2 times per year
- **Phone:** Contact Services Australia Families line - for additional changes

**Common scenarios for adjusting withholding:**
- **Increase withholding:** If you expect your income to increase significantly
- **Decrease to 0%:** If your income is stable and you want maximum cash flow
- **Increase to 10%+:** If you've had overpayment debts in previous years

### Year-End Reconciliation

At the end of the financial year:
1. Services Australia compares your actual income (from ATO) with your estimate
2. Your CCS entitlement is recalculated based on actual income
3. If withholding exceeded any overpayment, you receive the difference
4. If withholding was insufficient, you may need to repay the shortfall

### Impact on Calculator Results

All calculator results show:
- **Gross Subsidy:** CCS amount before withholding
- **Withheld Amount:** Amount held back by Services Australia
- **Paid Subsidy:** Actual subsidy paid to your provider
- **Out-of-Pocket:** Cost after paid subsidy (not gross subsidy)

The default withholding rate of 5% is applied to all calculations unless specified otherwise.

## Daily Rate Calculations (New in 2026)

Most Australian childcare centres charge by the day rather than by the hour. The calculator now supports both daily and hourly charging modes.

### Daily Rate Caps

```
Daily Rate Cap = Hourly Rate Cap × Hours Charged Per Day
```

**Example:**
- Centre-based, child age 3
- Hourly rate cap: $14.63/hour
- Hours charged per day: 10
- **Daily rate cap: $146.30/day**

### Effective Daily Rate

```
Effective Daily Rate = min(Provider Daily Fee, Daily Rate Cap)
```

**Example:**
- Provider daily fee: $120/day
- Daily rate cap: $146.30/day
- **Effective daily rate: $120/day** (provider fee is lower)

### Subsidy Per Day

```
Subsidy Per Day = (Subsidy Rate ÷ 100) × Effective Daily Rate
```

**Example:**
- Subsidy rate: 90%
- Effective daily rate: $120/day
- **Subsidy per day: $108/day**

### Weekly Costs (Daily Rate Mode)

```
Days With Subsidy = min(Subsidised Days, Actual Days)
Days Without Subsidy = max(0, Actual Days - Subsidised Days)

Weekly Subsidy = Subsidy Per Day × Days With Subsidy
Weekly Full Cost = Provider Daily Fee × Actual Days
Weekly Out-of-Pocket = Weekly Full Cost - Weekly Subsidy
```

**Example:**
- Subsidy per day: $108
- Provider daily fee: $120
- Subsidised days: 5 (from activity test)
- Actual days needed: 3 (from parent schedule)

Calculations:
- Days with subsidy: min(5, 3) = 3
- Days without subsidy: max(0, 3 - 5) = 0
- Weekly subsidy: $108 × 3 = $324
- Weekly full cost: $120 × 3 = $360
- **Weekly out-of-pocket: $360 - $324 = $36**

## Parent Work Schedule & Childcare Days

### Module: `parent-schedule.js`

The calculator now considers which specific days parents work to calculate the minimum number of childcare days needed.

#### Minimum Childcare Days

```
Childcare Days = Union of Parent 1 Work Days and Parent 2 Work Days
```

**Key Principle:** Childcare is only needed on days when at least one parent is working.

**Example 1: Overlapping Schedules**
- Parent 1 works: Monday, Tuesday, Wednesday, Thursday (4 days)
- Parent 2 works: Tuesday, Wednesday, Thursday, Friday (4 days)
- **Childcare needed: Monday-Friday (5 days)**
- Overlapping days: Tuesday, Wednesday, Thursday (3 days)

**Example 2: Completely Different Schedules**
- Parent 1 works: Monday, Wednesday, Friday (3 days)
- Parent 2 works: Tuesday, Thursday (2 days)
- **Childcare needed: Monday-Friday (5 days)**
- No overlapping days

**Example 3: Optimal Arrangement**
- Parent 1 works: Monday, Tuesday, Wednesday, Thursday (4 days)
- Parent 2 works: Monday, Tuesday, Wednesday, Thursday (4 days - same days)
- **Childcare needed: Monday-Thursday (4 days)**
- Friday: Neither parent working - no childcare needed
- **Weekly savings: 1 day of childcare**

#### Cost Savings from Parent Availability

```
Days Without Care = 5 - Childcare Days Needed
Weekly Savings = Days Without Care × Daily Fee
Annual Savings = Weekly Savings × 52 weeks
Percentage Saved = (Days Without Care ÷ 5) × 100%
```

**Example:**
- Daily fee: $120
- Childcare days needed: 3
- Days without care: 5 - 3 = 2

Savings:
- Weekly savings: 2 × $120 = $240
- **Annual savings: $240 × 52 = $12,480**
- **Percentage saved: 40%**

## Complete Calculation Flow

### Step-by-Step Process

1. **Calculate Adjusted Incomes**
   - Parent 1 adjusted income
   - Parent 2 adjusted income (if applicable)
   - Household income (sum)

2. **Determine Subsidy Rates**
   - For each child:
     - Determine position (eldest ≤5, younger ≤5, or >5)
     - Calculate applicable subsidy rate

3. **Calculate Subsidised Hours**
   - Calculate each parent's hours/fortnight
   - Apply activity test
   - Determine subsidised hours/week

4. **Calculate Actual Hours Needed**
   - Based on parent work schedules
   - Use maximum of parents' hours (simplified)

5. **Calculate Costs Per Child**
   - Effective hourly rate
   - Subsidy per hour
   - Weekly costs
   - Annual costs

6. **Calculate Household Totals**
   - Sum costs across all children
   - Calculate net income
   - Calculate cost as % of income

### Complete Example

**Family Details:**
- Household income: $100,000 (both parents working)
- 2 children: age 4 and age 2
- Centre-based care, provider fee: $15/hour
- Parent 1: 5 days × 8 hours
- Parent 2: 3 days × 7.6 hours

**Calculations:**

1. **Subsidy Rates:**
   - Child 1 (age 4, eldest ≤5): 87% (standard rate)
   - Child 2 (age 2, younger ≤5): 91% (higher rate)

2. **Subsidised Hours:**
   - Parent 1: 80 hours/fortnight
   - Parent 2: 45.6 hours/fortnight
   - Lower activity: 45.6 ≤ 48
   - **Subsidised: 36 hours/week**

3. **Actual Hours:**
   - Parent 1: 40 hours/week
   - Parent 2: 22.8 hours/week
   - **Actual: 40 hours/week**

4. **Costs (per child):**
   - Effective rate: $14.63/hour (rate cap)
   - Child 1 subsidy: 87% × $14.63 = $12.73/hour
   - Child 2 subsidy: 91% × $14.63 = $13.31/hour
   
   Weekly costs:
   - Child 1: $600 - ($12.73 × 36) = $141.72
   - Child 2: $600 - ($13.31 × 36) = $120.84
   - **Total out-of-pocket: $262.56/week**
   
   Annual:
   - **Total out-of-pocket: $13,653.12/year**

5. **Net Income:**
   - **$100,000 - $13,653.12 = $86,346.88**
   - **Cost as % of income: 13.65%**

## Updating for New Financial Years

When CCS rates change:

1. Update `/src/js/config/ccs-config.js`
2. Modify the relevant constants:
   - `STANDARD_RATE_THRESHOLDS`
   - `HIGHER_RATE_THRESHOLDS`
   - `ACTIVITY_TEST`
   - `HOURLY_RATE_CAPS`
   - `FINANCIAL_YEAR`
3. Run tests to verify: `npm test`
4. Update this documentation with new values
5. Update README.md with current financial year

## Per-Person Effective Rates

### Module: `per-person-rates.js`

Added in 2026-01 to help families understand the impact of childcare costs on each parent's income individually.

#### Effective Rate Calculation

Calculates what each parent would pay if all childcare costs came from their salary alone:

```
Daily Rate = Annual Out-of-Pocket ÷ 52 weeks ÷ 5 days
Weekly Rate = Annual Out-of-Pocket ÷ 52 weeks
Monthly Rate = Annual Out-of-Pocket ÷ 12 months
Annual Rate = Annual Out-of-Pocket
Percentage of Income = (Annual Out-of-Pocket ÷ Parent Income) × 100
Net After Childcare = Parent Income - Annual Out-of-Pocket
```

**Key Features:**
- Shows daily, weekly, monthly, and annual rates per parent
- Displays percentage of each parent's income
- Calculates net income after childcare for each parent
- Provides comparison between parents

#### Threshold Warning System

The calculator monitors household income proximity to critical subsidy thresholds for families with multiple children aged ≤5.

**Critical Thresholds:**
- **$357,563**: Entry to flat 50% subsidy zone for younger children
- **$367,563**: Exit from 50% zone (income at or above this reverts to standard rate)

**Warning Levels:**

1. **Low Risk** (within $10k below $357,563):
   - "Approaching $357,563 threshold"
   - Informational (blue)

2. **Medium Risk** ($357,563 - $367,562):
   - "In the 50% subsidy zone"
   - Warning (orange) - cautions against exceeding $367,562

3. **High Risk** (within $10k above $367,563):
   - "Just crossed the $367,563 threshold"
   - Alert (red) - suggests considering salary sacrifice or other strategies

**Example:**

For a family with household income of $370,000 and two children under 5:
- Status: High Risk (crossed threshold by $2,437)
- Impact: Younger children now use standard rate (~33%) instead of 50%
- Recommendation: Consider salary sacrifice to drop below $367,563

**Note:** Threshold warnings only apply to families with 2+ children aged ≤5, as this is the only scenario where the higher subsidy rate applies to younger siblings.

## References

- Australian Government Department of Education
- Child Care Subsidy policy documentation
- Current as of: 2025-26 Financial Year
