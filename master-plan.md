# CCS Calculator - Master Plan

## Overview
An interactive Child Care Subsidy (CCS) Estimator for Australian parents, deployed as an Azure Static Web App with Azure Functions backend. This tool helps families estimate their CCS entitlements and out-of-pocket childcare costs across different work scenarios.

## Project Structure
- **Frontend**: Static web application (HTML, CSS, Vanilla JavaScript)
- **Backend**: Azure Functions for any server-side processing (optional)
- **Deployment**: Azure Static Web Apps

## Technical Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Node.js**: Version 20 LTS (latest supported by Azure Static Web Apps)
- **Testing**: Jest (minimal, for calculation logic only)
- **Build**: No build step required for vanilla JS (optional bundler if needed)
- **Dependencies**: Minimal - only add if absolutely necessary and well-maintained
- **Philosophy**: Keep it simple, lightweight, and maintainable with native web technologies

## Current Status
📋 Phase 2 Complete - Core calculation engine implemented with comprehensive tests and centralized configuration

### Phase 2 Summary
All four core calculation modules have been implemented with full test coverage:
- ✅ Income calculations (39 tests)
- ✅ Subsidy rate calculations (50 tests) 
- ✅ Activity test calculations (44 tests)
- ✅ Cost calculations (47 tests)
- ✅ Centralized configuration for easy annual updates
- ✅ Comprehensive documentation

**Total: 180 tests, all passing**

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
- [x] Review and structure requirements
- [x] Define development phases
- [x] Define technical stack (Vanilla JS, HTML5, CSS3, Node 20 LTS)
- [x] Create package.json with minimal dependencies
- [x] Update documentation to reflect vanilla JS approach

### Phase 2: Core Calculation Engine ✅ COMPLETE
**Goal:** Build the CCS calculation logic as reusable, testable modules

#### 2.1 Income Calculations
- [x] Create `src/js/calculations/income.js` module
- [x] Implement adjusted income calculation for individual parents
- [x] Implement household income aggregation
- [x] Add input validation (numeric values, reasonable ranges)
- [x] Write unit tests for income calculations
- [x] Document income calculation logic

#### 2.2 CCS Percentage (Subsidy Rate) Calculations
- [x] Create `src/js/calculations/subsidy-rate.js` module
- [x] Implement standard rate calculation (eldest child ≤5)
- [x] Implement higher subsidy rate for younger siblings
- [x] Implement tiered percentage decreases based on income brackets
- [x] Handle edge cases (income at exact thresholds)
- [x] Write unit tests for all subsidy rate scenarios
- [x] Document subsidy rate logic and 2025-26 thresholds

#### 2.3 Activity Test & Subsidised Hours
- [x] Create `src/js/calculations/activity-test.js` module
- [x] Implement base 72 hours/fortnight calculation
- [x] Implement 100 hours/fortnight for higher activity families
- [x] Calculate actual childcare hours needed based on parent work schedules
- [x] Handle overlapping work hours logic
- [x] Write unit tests for activity test scenarios
- [x] Document activity test rules

#### 2.4 Hourly Rate Cap & Cost Calculations
- [x] Create `src/js/calculations/costs.js` module
- [x] Define hourly rate cap constants (by care type and age)
- [x] Implement effective hourly rate calculation
- [x] Calculate subsidy per hour
- [x] Calculate weekly subsidy, costs, and out-of-pocket amounts
- [x] Calculate net annual income after childcare
- [x] Calculate childcare cost as percentage of income
- [x] Write comprehensive unit tests
- [x] Document cost calculation formulas

#### 2.5 Testing & Validation
- [x] Set up Jest or similar testing framework
- [x] Create test data fixtures with known outcomes
- [x] Verify calculations against official CCS calculator (if available)
- [x] Add edge case tests (zero income, maximum income, etc.)
- [x] Document test coverage

#### 2.6 Configuration Management (NEW)
- [x] Create centralized configuration file `src/js/config/ccs-config.js`
- [x] Move all thresholds and rates to config
- [x] Update all modules to use centralized config
- [x] Document configuration update process for annual rate changes

### Phase 3: Basic User Interface 🎯 NEXT
**Goal:** Create a functional single-scenario calculator with manual input

#### 3.1 HTML Structure & Layout
- [ ] Update `src/index.html` with calculator form structure
- [ ] Create sections: Parent 1, Parent 2, Children, Provider Details
- [ ] Add input fields for all required data points
- [ ] Implement responsive layout framework
- [ ] Add accessibility attributes (ARIA labels, roles)
- [ ] Test on mobile and desktop viewports

#### 3.2 CSS Styling
- [ ] Update `src/styles.css` with calculator-specific styles
- [ ] Create form styling (inputs, labels, validation states)
- [ ] Style results display section
- [ ] Implement responsive breakpoints
- [ ] Add visual feedback for interactive elements
- [ ] Ensure WCAG 2.1 AA compliance (contrast, focus states)

#### 3.3 Form Integration
- [ ] Create `src/js/ui/form-handler.js` module
- [ ] Implement form data collection and validation
- [ ] Connect form inputs to calculation engine
- [ ] Display calculation results in UI
- [ ] Add input validation and error messages
- [ ] Handle edge cases (empty fields, invalid data)
- [ ] Test form functionality

#### 3.4 Basic Results Display
- [ ] Create results section in HTML
- [ ] Display all required outputs (subsidy %, costs, net income, etc.)
- [ ] Format currency (AUD) and percentages correctly
- [ ] Add clear labeling for all results
- [ ] Test results display with various scenarios

### Phase 4: Scenario Simulation & Comparison
**Goal:** Auto-generate and compare multiple work scenarios

#### 4.1 Scenario Generator
- [ ] Create `src/js/scenarios/generator.js` module
- [ ] Implement auto-generation of workday combinations
- [ ] Generate relevant scenarios (5+5, 4+5, 3+5, 3+3, 2+4, 0+5, etc.)
- [ ] Allow custom scenario definition
- [ ] Optimize scenario generation (avoid duplicates)
- [ ] Document scenario generation logic

#### 4.2 Comparison Table
- [ ] Create `src/js/ui/comparison-table.js` module
- [ ] Design comparison table layout (HTML/CSS)
- [ ] Display multiple scenarios side-by-side
- [ ] Highlight key differences between scenarios
- [ ] Sort/filter scenarios by net income or other metrics
- [ ] Make table responsive for mobile devices
- [ ] Add export to CSV functionality

#### 4.3 Interactive Scenario Selection
- [ ] Allow users to select which scenarios to compare
- [ ] Add "favorite" or "save" scenario functionality
- [ ] Enable scenario editing/customization
- [ ] Implement scenario naming
- [ ] Test scenario management features

### Phase 5: Real-Time Interactivity
**Goal:** Implement live updates without page refresh using Vanilla JS

#### 5.1 Event-Driven Updates (Vanilla JS)
- [ ] Implement event listeners for all input fields
- [ ] Use input/change events for real-time updates
- [ ] Implement debouncing function (vanilla JS) for performance
- [ ] Create reactive update flow without frameworks
- [ ] Test real-time updates across all inputs

#### 5.2 Live Calculation Updates
- [ ] Connect input changes to calculation engine
- [ ] Update results automatically on input change
- [ ] Add visual feedback during recalculation (CSS animations)
- [ ] Optimize performance with memoization/caching
- [ ] Test with rapid input changes

#### 5.3 Performance Optimization
- [ ] Profile calculation performance
- [ ] Implement memoization for unchanged inputs (vanilla JS)
- [ ] Use DocumentFragment for efficient DOM updates
- [ ] Add caching for scenario comparisons
- [ ] Minimize DOM reflows and repaints
- [ ] Test performance with multiple children/scenarios
- [ ] Document optimization strategies

### Phase 6: Enhanced Features
**Goal:** Add optional but valuable features

#### 6.1 Data Visualization
- [ ] Evaluate lightweight charting options (Chart.js as minimal option, or vanilla JS SVG/Canvas)
- [ ] Create bar chart comparing net income across scenarios
- [ ] Create pie chart showing cost breakdown
- [ ] Add interactive tooltips (vanilla JS)
- [ ] Make charts responsive
- [ ] Test accessibility of visualizations
- [ ] **Note:** Only add charting library if native SVG/Canvas is too complex

#### 6.2 Export & Sharing
- [ ] Implement PDF export (consider browser print API or minimal library like jsPDF)
- [ ] Add CSV export using vanilla JS (Blob and URL.createObjectURL)
- [ ] Create shareable URL with URLSearchParams for encoding parameters
- [ ] Add "print-friendly" view with CSS @media print
- [ ] Test export features across browsers
- [ ] **Note:** Prefer native browser APIs over libraries where possible

#### 6.3 Advanced UI Features
- [ ] Add weekly/annual view toggle
- [ ] Implement "what-if" sliders for quick adjustments
- [ ] Add preset scenarios (common work arrangements)
- [ ] Create help tooltips explaining CCS rules
- [ ] Add calculator tour/onboarding
- [ ] Implement dark mode (optional)

#### 6.4 Multi-child Support Enhancement
- [ ] Improve UI for managing multiple children
- [ ] Add/remove children dynamically
- [ ] Handle different care types per child
- [ ] Show per-child cost breakdown
- [ ] Test with 1-5 children scenarios

### Phase 7: Backend Integration (Optional)
**Goal:** Add server-side features if needed

#### 7.1 Azure Functions Setup
- [ ] Create Azure Function for calculation validation
- [ ] Set up API endpoints in `api/` folder
- [ ] Implement error handling and logging
- [ ] Add CORS configuration
- [ ] Test locally with Azure Functions Core Tools

#### 7.2 Data Persistence (Optional)
- [ ] Set up Azure Storage or Database (if needed)
- [ ] Implement save/load scenarios functionality
- [ ] Add user session management
- [ ] Test data persistence

#### 7.3 Rate Updates API (Future)
- [ ] Create endpoint to fetch current year's rates
- [ ] Allow admin updates to thresholds
- [ ] Version control for different financial years
- [ ] Document API endpoints

### Phase 8: Testing & Quality Assurance
**Goal:** Comprehensive testing and validation

#### 8.1 Unit Testing
- [ ] Achieve >80% code coverage for calculation modules
- [ ] Test all edge cases
- [ ] Add regression tests for bug fixes
- [ ] Document test cases

#### 8.2 Integration Testing
- [ ] Test form submission to calculation flow
- [ ] Test scenario generation to comparison flow
- [ ] Test export functionality end-to-end
- [ ] Validate against official CCS calculator results

#### 8.3 Browser & Device Testing
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on iOS and Android devices
- [ ] Test various screen sizes
- [ ] Verify accessibility with screen readers
- [ ] Fix any compatibility issues

#### 8.4 User Acceptance Testing
- [ ] Create test scenarios based on real use cases
- [ ] Gather feedback from potential users
- [ ] Address usability issues
- [ ] Document known limitations

### Phase 9: Documentation & Deployment
**Goal:** Prepare for production deployment

#### 9.1 User Documentation
- [ ] Create user guide in `documentation/user-guide.md`
- [ ] Add FAQ section
- [ ] Document known limitations
- [ ] Create screenshots/demo video
- [ ] Add disclaimer about official CCS rates

#### 9.2 Technical Documentation
- [ ] Document all calculation formulas in `documentation/calculations.md`
- [ ] Create API documentation (if applicable)
- [ ] Document architecture in `documentation/architecture.md`
- [ ] Add code comments and JSDoc
- [ ] Create developer setup guide

#### 9.3 Azure Deployment Setup
- [ ] Create Azure Static Web App resource
- [ ] Configure GitHub Actions for CI/CD
- [ ] Set up environment variables
- [ ] Configure custom domain (if applicable)
- [ ] Test deployment pipeline

#### 9.4 Production Deployment
- [ ] Deploy to staging environment
- [ ] Perform final testing on staging
- [ ] Deploy to production
- [ ] Set up monitoring and analytics
- [ ] Document deployment process

### Phase 10: Maintenance & Updates
**Goal:** Ongoing maintenance and improvements

#### 10.1 Annual Updates
- [ ] Monitor for CCS policy changes each financial year
- [ ] Update thresholds and rates as needed
- [ ] Test updated calculations
- [ ] Communicate changes to users
- [ ] Version the application appropriately

#### 10.2 Bug Fixes & Improvements
- [ ] Set up issue tracking
- [ ] Prioritize and fix reported bugs
- [ ] Implement user-requested features
- [ ] Optimize performance based on usage
- [ ] Update dependencies regularly

---

## Project Brief: Interactive Child Care Subsidy (CCS) Estimator Web App (Australia)

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
