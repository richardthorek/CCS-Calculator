# GitHub Copilot Instructions for CCS Calculator

## Project Overview
This is a Child Care Subsidy (CCS) Calculator for Australian parents - an interactive web application deployed as an Azure Static Web App with Azure Functions for backend processing. The tool helps families estimate their CCS entitlements and out-of-pocket childcare costs across different work scenarios.

**Technology Philosophy:** Use HTML and Vanilla JavaScript as much as possible. Minimize dependencies and only use contemporary, well-supported packages when absolutely necessary.

## Architecture
- **Frontend**: Interactive web application using Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Azure Functions (serverless) for API endpoints (optional, only if needed)
- **Node.js**: Version 20 LTS (latest supported by Azure Static Web Apps)
- **Dependencies**: Minimal - only use if native web APIs cannot achieve the goal
- **Deployment**: Azure Static Web Apps with integrated CI/CD

## Project Organization
- **`master-plan.md`**: Contains all planning, phased development roadmap, current status, and requirements
- **`documentation/`**: Contains all as-built documentation
- Frontend code is in the `src/` folder
- Backend code should be in the `api/` folder (Azure Functions standard)

## Master Plan Workflow ⚠️ CRITICAL

### Always Check the Master Plan First
**Before starting ANY development work:**
1. Read `master-plan.md` to identify the current phase and next tasks
2. Look for the 🎯 NEXT marker to find the current phase
3. Review unchecked [ ] items in the current phase
4. Understand dependencies between tasks

### Update the Master Plan as You Go
**As you complete work:**
1. Mark completed items with [x] in the master plan
2. Update the "Current Status" section with progress
3. Move the 🎯 NEXT marker to the new current phase when a phase completes
4. Add new tasks to phases if you discover additional work needed
5. Document any deviations or changes from the original plan

### Master Plan Update Format
When updating the master plan:
- Mark completed tasks: `- [x] Task description`
- Keep incomplete tasks: `- [ ] Task description`
- Add new discovered tasks with appropriate context
- Update phase status when all tasks are complete
- Keep the plan synchronized with actual development progress

**Example update workflow:**
```
1. Check master-plan.md → See Phase 2.1 has uncompleted tasks
2. Complete a task → Implement income.js module
3. Update master-plan.md → Mark "Create income.js module" as [x]
4. Document work → Update documentation/calculations.md with income logic
5. Report progress → Commit changes with clear message
```

## Development Guidelines

### Vanilla JavaScript First Approach 🎯
**CRITICAL: Always prefer native web technologies over libraries/frameworks**

- **Use Vanilla JavaScript (ES6+)** for all application logic
- **Use native DOM APIs** instead of jQuery or similar libraries
- **Use CSS** for animations and transitions instead of JS libraries
- **Use native Fetch API** for any HTTP requests (no Axios)
- **Use native modules** (import/export) for code organization
- **Use Web Components** if reusable components are needed (no React/Vue)
- **Only add a package if:**
  1. The native web API doesn't exist or is inadequate
  2. The package is actively maintained (updated within last 6 months)
  3. The package is widely adopted and trusted
  4. The benefit significantly outweighs the added complexity

### Code Style
- Write clean, maintainable code with clear comments
- Follow modern JavaScript ES6+ best practices
- Use `const` and `let` (never `var`)
- Use arrow functions, destructuring, template literals
- Use async/await for asynchronous operations (no callbacks or old Promise chains)
- Implement proper error handling with try-catch
- Modularize code using ES6 modules (import/export)
- Use pure functions for calculations (no side effects)

### CCS Calculator Specifics
- Keep calculation logic separate from UI code
- Make calculation modules pure functions for easy testing
- Use constants for thresholds and rates (2025-26 values)
- Format currency as AUD ($), percentages with 2 decimal places
- Validate all user inputs before calculations
- Handle edge cases gracefully (zero income, invalid inputs, etc.)
- Use data attributes (data-*) for connecting UI elements to logic

### Native Web APIs to Use
- **DOM Manipulation**: `querySelector`, `querySelectorAll`, `createElement`, `DocumentFragment`
- **Events**: `addEventListener`, event delegation, custom events
- **Forms**: `FormData`, native form validation
- **Storage**: `localStorage`, `sessionStorage` for saving scenarios
- **URL**: `URLSearchParams` for shareable links
- **Export**: `Blob`, `URL.createObjectURL` for CSV export
- **Print**: `window.print()`, CSS `@media print` for PDF export
- **Animation**: CSS transitions and animations, `requestAnimationFrame` if needed
- **Date/Time**: Native `Date`, `Intl.NumberFormat` for currency formatting

### Package Management
- **Node.js Version**: 20 LTS (latest supported by Azure Static Web Apps)
- **Package Manager**: npm (comes with Node.js)
- **Testing Only**: Jest or Vitest for testing calculation modules
- **Build Tools**: None required for vanilla JS (only add if absolutely necessary)
- **Allowed Libraries** (only if native APIs insufficient):
  - Chart.js (if vanilla SVG/Canvas charting is too complex)
  - jsPDF (if browser print API insufficient for PDF export)
- **Before adding ANY package**: Document why native APIs cannot achieve the goal

### Azure Static Web Apps Specifics
- Frontend files should be in the `src/` folder structure
- Azure Functions should be in the `api/` folder (if needed)
- Use environment variables for configuration
- Follow Azure Functions best practices for Node.js

### Documentation
- **ALWAYS check `master-plan.md` before starting work** to identify current phase and tasks
- **ALWAYS update `master-plan.md` as you complete tasks** - mark items with [x]
- Document all calculation formulas in `documentation/calculations.md`
- Document completed features in the `documentation/` folder
- Include API documentation for backend endpoints (if applicable)
- Keep README.md up-to-date with setup and usage instructions
- Add code comments explaining complex CCS logic

### Testing
- Write unit tests for ALL calculation modules
- Test edge cases and boundary conditions
- Verify calculations against official CCS calculator results
- Test across modern browsers (Chrome, Firefox, Safari, Edge)
- Ensure mobile responsiveness
- Test accessibility with screen readers

### Deployment
- Use Azure Static Web Apps CLI for local development
- Configure GitHub Actions for CI/CD
- Follow Azure best practices for security and performance

## Key Patterns
- RESTful API design for backend endpoints
- Responsive design for frontend
- Separation of concerns between frontend and backend
- Environment-based configuration (dev, staging, prod)

## Common Tasks
- **Before starting work**: Check `master-plan.md` for current phase (look for 🎯 NEXT marker)
- **After completing work**: Update `master-plan.md` and mark tasks complete with [x]
- **When adding a new feature**: Update master-plan.md first, implement, then document in documentation/
- **When creating API endpoints**: Place in api/ folder, follow Azure Functions structure (only if backend needed)
- **When making architectural changes**: Document in documentation/architecture.md
- **Before adding a package**: 
  1. Try to solve with vanilla JS/native APIs first
  2. Document why native solution won't work
  3. Verify package is contemporary and actively maintained
  4. Add to package.json with justification in comments
- **When implementing UI features**: Use vanilla JS, native DOM APIs, and CSS (no jQuery, no frameworks)
- **When implementing calculations**: Create pure functions in separate modules for testability
