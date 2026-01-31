# CCS Calculator - UI Usage Guide

## Getting Started

### Prerequisites
- Node.js 20 LTS or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Running the Application

#### Option 1: Using npm (Recommended)
```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Then open your browser to: `http://localhost:3000`

#### Option 2: Using Python
```bash
# Navigate to src directory
cd src

# Start HTTP server
python3 -m http.server 8000
```

Then open your browser to: `http://localhost:8000`

#### Option 3: Using any HTTP server
The calculator requires an HTTP server to load ES6 modules. You can use any static file server:
- `npx serve src -p 3000`
- `python -m http.server 8000` (from src directory)
- VS Code Live Server extension
- Any other static file server

**Note:** Cannot open `index.html` directly with `file://` protocol due to ES6 module restrictions.

## Using the Calculator

### Step 1: Enter Parent 1 Details (Required)
- **Full-Time Equivalent Annual Income**: Your annual income as if working full-time (5 days/week). If you work part-time, enter what you would earn at your current rate working 5 days/week.
  - The system will automatically adjust this based on your actual work days and hours
  - A real-time display shows your adjusted income for the calculation
- **Work Days per Week**: Number of days worked (0-5)
- **Hours per Day**: Average hours worked per day (e.g., 7.6 for full-time)
- **Which Days Do You Work**: Select the specific days you work each week

### Step 2: Enter Parent 2 Details (Optional)
- Same fields as Parent 1
- Leave blank if single-parent household
- For dual-income families, enter second parent's details

### Step 3: Add Children
- Click "Add Child" to add more children
- For each child, enter:
  - **Age**: Child's age in years (0-18)
  - **Care Type**: Select from dropdown
    - Centre-Based Day Care
    - Family Day Care
    - Outside School Hours Care (OSHC)
    - In-Home Care
  - **Hours per Week**: Total childcare hours needed
  - **Provider Hourly Fee**: What your provider charges per hour

### Step 4: Calculate
- Click "Calculate CCS" to see your results
- Results include:
  - Adjusted household income
  - CCS subsidy percentage per child
  - Weekly subsidy amount
  - Weekly out-of-pocket costs
  - Net annual income after childcare
  - Childcare cost as percentage of income

### Step 5: Reset (Optional)
- Click "Reset Form" to clear all fields and start over
- This removes all children except the first one

## Understanding Your Results

### Summary Cards
- **Household Income**: Your adjusted annual income based on work patterns
- **Weekly Subsidy**: Total government contribution per week
- **Weekly Out-of-Pocket**: Your actual weekly cost after subsidy
- **Net Annual Income**: Income remaining after childcare costs

### Per-Child Breakdown
Each child shows:
- CCS percentage rate (varies by income and child order)
- Hours of care per week
- Provider's hourly fee
- Weekly subsidy amount
- Weekly total cost
- Weekly out-of-pocket expense

### Activity Test Results
- **Subsidised Hours**: Government-approved hours per week
  - Base: 36 hours/week for all families
  - Higher: 50 hours/week if lower-activity parent works >48 hours/fortnight
- **Cost as % of Income**: Childcare expenses relative to household income

## Tips for Accurate Estimates

1. **Income**: Use your gross annual income (before tax)
2. **Work Hours**: Average your typical work schedule
3. **Variable Hours**: Use your regular/contracted hours, not overtime
4. **Multiple Jobs**: Add all employment income together
5. **Part-time Work**: Enter actual days/hours worked
6. **Provider Fees**: Use the rate you're quoted (subsidy is capped by government)

## Example Scenarios

### Example 1: Full-time Dual Income
- Parent 1: $100,000/year, 5 days, 7.6 hours
- Parent 2: $80,000/year, 3 days, 7.6 hours
- Child: 3 years, Centre-Based, 40 hrs/week, $12.50/hr
- **Result**: 77% CCS rate, $346.50/week subsidy

### Example 2: Single Parent
- Parent 1: $60,000/year, 4 days, 8 hours
- Parent 2: (leave blank)
- Child: 2 years, Family Day Care, 32 hrs/week, $11/hr
- **Result**: Higher CCS rate due to lower income

### Example 3: Multiple Children
- Parents: As in Example 1
- Child 1: 4 years, Centre-Based, 35 hrs/week, $13/hr
- Child 2: 1 year, Centre-Based, 35 hrs/week, $14/hr
- **Result**: Child 2 gets higher CCS rate (younger sibling benefit)

## Troubleshooting

### Form Won't Submit
- Check for red error messages under fields
- Ensure all required fields (*) are filled
- Verify values are within allowed ranges

### Unexpected Results
- Verify income is annual (not monthly or weekly)
- Check work days are per week (not per fortnight)
- Ensure hours per day are reasonable (not per week)
- Confirm provider fee is hourly (not daily or weekly)

### Page Won't Load
- Ensure you're using an HTTP server (not file:// protocol)
- Check browser console for errors (F12)
- Verify Node.js version is 20 LTS or higher
- Try a different browser

## Browser Compatibility

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Minimum Requirements
- ES6 module support
- CSS Grid and Flexbox
- Intl.NumberFormat API
- ES6+ JavaScript features

## Accessibility Features

- Full keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader compatible
- High contrast mode support
- Focus indicators for keyboard users
- ARIA labels and roles throughout
- Error messages announced to screen readers

### Keyboard Shortcuts
- **Tab**: Navigate between fields
- **Shift+Tab**: Navigate backwards
- **Enter**: Submit form (when Calculate button focused)
- **Escape**: Close any dialogs (not applicable in current version)

## Privacy & Data

- **No data is stored**: All calculations happen in your browser
- **No server communication**: Calculator works offline once loaded
- **No tracking**: No analytics or data collection
- **Local only**: Your information never leaves your device

## Accuracy Disclaimer

This calculator provides **estimates only**. Actual subsidy amounts may vary based on:
- Individual circumstances
- Policy changes
- Calculation timing
- Additional eligibility criteria

For official CCS information and to apply, visit:
[Services Australia - Child Care Subsidy](https://www.servicesaustralia.gov.au/child-care-subsidy)

## Getting Help

### Technical Issues
- Check browser console (F12) for errors
- Ensure all files are present in `src/` directory
- Verify HTTP server is running
- Try clearing browser cache

### Calculation Questions
- Review the [Calculations Documentation](../calculations.md)
- Check the [Project Setup Guide](../project-setup.md)
- See [Services Australia](https://www.servicesaustralia.gov.au/) for official rates

## Development

### Making Changes
```bash
# Run tests
npm test

# Edit files in src/
# - src/index.html (structure)
# - src/styles.css (styling)
# - src/js/ui/form-handler.js (logic)

# Refresh browser to see changes
```

### Testing Your Changes
1. Fill form with test data
2. Click Calculate
3. Verify results match expected values
4. Test on different screen sizes
5. Test keyboard navigation
6. Run `npm test` to ensure no regressions

## Next Steps

Once you're familiar with the basic calculator:
- **Phase 4** will add scenario comparison
- **Phase 5** will add real-time updates
- **Phase 6** will add charts and export features

Stay tuned for updates!

---

**Version**: Phase 3 Complete
**Last Updated**: January 31, 2026
**Status**: Production Ready ✅
