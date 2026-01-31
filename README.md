# CCS-Calculator
Child Care Subsidy (CCS) Calculator for Australian parents

## Overview
An interactive web application for Australian families to estimate their Child Care Subsidy (CCS) entitlements and out-of-pocket childcare costs. Built with vanilla JavaScript for simplicity, performance, and maintainability.

## Technology Stack
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with responsive design
- **Vanilla JavaScript (ES6+)** - No frameworks, pure web standards
- **Node.js 20 LTS** - For development tools only
- **Azure Static Web Apps** - Hosting and deployment

## Philosophy
This project uses **native web technologies** as much as possible:
- ✅ Vanilla JavaScript instead of React/Vue/Angular
- ✅ Native DOM APIs instead of jQuery
- ✅ CSS animations instead of JavaScript animation libraries
- ✅ Native modules (import/export) for code organization
- ✅ Minimal dependencies - only add if absolutely necessary

## Project Structure
```
CCS-Calculator/
├── src/                    # Frontend source code
│   ├── index.html         # Main HTML entry point
│   ├── styles.css         # Global styles
│   ├── app.js             # Main application JavaScript
│   └── js/                # JavaScript modules
│       ├── calculations/  # Calculation engine modules
│       ├── ui/            # UI handler modules
│       └── scenarios/     # Scenario generation modules
├── api/                    # Azure Functions backend (optional)
├── documentation/          # As-built documentation
├── master-plan.md         # Project planning and phases
├── .github/               # GitHub configuration and Copilot instructions
└── package.json           # Node.js configuration (minimal dependencies)
```

## Getting Started

### Prerequisites
- Node.js 20 LTS or higher
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Azure account (for deployment only)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/richardthorek/CCS-Calculator.git
   cd CCS-Calculator
   ```

2. **Install development dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

4. **No build step required!**
   Since we're using vanilla JavaScript, you can also just open `src/index.html` directly in a browser for quick testing.

### Development Workflow

1. **Check the master plan**: Always read `master-plan.md` to see the current phase and next tasks (look for 🎯 NEXT marker)
2. **Implement features**: Work on tasks in the current phase
3. **Update the plan**: Mark completed tasks with [x] in `master-plan.md`
4. **Document your work**: Add documentation to the `documentation/` folder
5. **Test thoroughly**: Ensure calculations are accurate and UI works across browsers

## Documentation
- **Master Plan**: See `master-plan.md` for phased development roadmap and current status
- **Technical Docs**: See `documentation/` folder for detailed documentation
- **Copilot Instructions**: See `.github/copilot-instructions.md` for development guidelines
- **Calculations**: See `documentation/calculations.md` (to be created) for CCS formula documentation

## Status
🚀 Ready for Phase 2: Core Calculation Engine development

Phase 1 is complete with:
- ✅ Project structure established
- ✅ Vanilla JavaScript approach defined
- ✅ Development phases planned in master-plan.md
- ✅ Node.js 20 LTS configured
- ✅ Minimal dependencies philosophy established

**Next**: Begin Phase 2 - Build the CCS calculation engine modules

## Key Features (Planned)
- Real-time CCS subsidy calculations (no page refresh needed)
- Multi-scenario comparison (compare different work arrangements)
- Interactive results display with visual feedback
- Export to CSV and PDF
- Mobile-responsive design
- Accessible (WCAG 2.1 AA compliant)
- Based on Australian Government 2025-26 CCS policy

## Contributing
Please update `master-plan.md` before implementing new features. Follow the phased approach and mark tasks as complete as you progress.
