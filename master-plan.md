# CCS Calculator - Master Plan

## Overview
A functional CCS (Carbon Capture and Storage) Calculator deployed as an Azure Static Web App with Azure Functions backend.

## Project Structure
- **Frontend**: Static web application (HTML, CSS, JavaScript)
- **Backend**: Azure Functions for any server-side processing
- **Deployment**: Azure Static Web Apps

## Current Status
🔧 Setting up project structure

## Planned Features
<!-- Add planned features here -->

## Future Enhancements
<!-- Add future enhancement ideas here -->

## Technical Requirements
- Azure Static Web App hosting
- Azure Functions for backend API
- Modern web technologies (to be defined)

## Development Phases

### Phase 1: Project Setup ✅
- [x] Initialize repository
- [x] Create master plan document
- [x] Set up documentation folder
- [x] Create Copilot instructions
- [ ] Define technical stack

### Phase 2: Core Functionality
Project Brief: Interactive Child Care Subsidy (CCS) Estimator Web App (Australia)

🎯 Intent

Build a responsive, interactive web application for Australian parents to estimate their Child Care Subsidy (CCS) entitlements and out-of-pocket childcare costs. The app should allow users to input key household and childcare details and instantly simulate multiple work scenarios (e.g. one or both parents working 1–5 days per week) without requiring page reloads or form submissions. The goal is to provide a clear, real-time comparison of how different work arrangements affect household income, childcare costs, and net financial outcomes.
This tool should simplify the complex CCS calculation process and empower families to make informed decisions about work-life balance and childcare affordability.
🧮 Core Calculations

The app must implement the official CCS formula as per the Australian Government’s 2025–26 policy. The following calculations are required:
1. Adjusted Household Income

For each parent:
Adjusted Income =
(Base Annual Income) × (Work Days per Week ÷ 5) × (Work Hours per Day ÷ Full-Time Hours)
Household Income = Sum of both parents’ adjusted incomes
If only combined income is provided, assume a 50/50 split or allow user-defined proportions.
2. CCS Percentage (Subsidy Rate)

For the standard rate child (eldest child aged ≤5):
Income ≤ $85,279 → 90%
$85,280–$535,278 → Decreases by 1% per $5,000
≥ $535,279 → 0%
For second and younger children aged ≤5:
Income ≤ $143,273 → 95%
$143,274–$188,272 → Decreases by 1% per $3,000
$188,273–$267,562 → 80%
$267,563–$357,562 → Decreases by 1% per $3,000
$357,563–$367,562 → 50%
≥ $367,563 → Reverts to standard CCS rate
Apply the appropriate rate to each child based on age and sibling order.
3. Activity Test – Subsidised Hours

All families: 72 hours/fortnight (36 hours/week) minimum
If lower-activity parent works >48 hours/fortnight → 100 hours/fortnight (50 hours/week)
Determine actual childcare hours needed per week based on overlapping workdays and hours between both parents.
4. Hourly Rate Cap

Apply the lower of the provider’s hourly fee or the government’s hourly rate cap:
Care Type
School Age
Centre-Based Day Care
$14.63
$12.81
Outside School Hours
$14.63
$12.81
Family Day Care
$13.56
$13.56
In-Home Care (per family)
$39.80
$39.80
Effective Hourly Rate = min(Provider Fee, Hourly Cap)
5. Subsidy and Cost Calculations

For each child:
Subsidy per Hour = CCS Rate × Effective Hourly Rate
Weekly Subsidy = Subsidy per Hour × Subsidised Hours
Weekly Full Cost = Provider Fee × Total Hours
Weekly Out-of-Pocket = Weekly Full Cost – Weekly Subsidy
Net Annual Income After Childcare = Adjusted Household Income – (Out-of-Pocket × 52)
Childcare Cost as % of Income = (Annual Out-of-Pocket ÷ Adjusted Income) × 100%
🧩 Features & Requirements

Real-time, no-refresh UI (e.g. React with state management)
Inputs:
Parent 1 & 2: Annual income, workdays/week (1–5), hours/day
Number of children, each child’s age
Provider hourly fee per child
Care type per child (dropdown: Centre-Based, Family Day Care, OSHC, In-Home)
Outputs:
Weekly childcare hours needed
Subsidised hours (based on activity test)
CCS % per child
Weekly subsidy amount
Weekly out-of-pocket cost
Adjusted household income
Net income after childcare
Childcare cost as % of income
Scenario simulation:
Auto-generate multiple combinations of workdays (e.g. 5+5, 4+5, 3+5, 3+3, 2+4, 0+5, etc.)
Display results in a comparison table
Optional:
Graphical visualisation (e.g. bar chart of net income vs. workdays)
Export to PDF or CSV
Save/share scenarios
🧠 Optimisation & Recommendations

Use memoisation or caching to avoid recalculating unchanged inputs
Consider using a reactive framework (e.g. React, Vue) for live updates
Modularise the CCS formula logic for easy updates (e.g. new financial year thresholds)
Validate inputs (e.g. income must be numeric, workdays 0–5, hours/day ≤12)
Allow toggling between weekly and annual views
Consider accessibility (WCAG 2.1), mobile responsiveness, and localisation (AU English, AUD currency)

## Notes
- Update this file with specific requirements before starting development
- All as-built documentation should go in the `documentation/` folder
