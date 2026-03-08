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
│   ├── privacy.html       # Privacy policy page
│   ├── styles.css         # Global styles
│   ├── app.js             # Main application JavaScript
│   └── js/                # JavaScript modules
│       ├── auth/          # Authentication (Azure SWA built-in OAuth)
│       ├── calculations/  # Calculation engine modules
│       ├── config/        # CCS rates & thresholds configuration
│       ├── scenarios/     # Scenario generation modules
│       ├── storage/       # Cloud storage manager
│       └── ui/            # UI handler modules
├── api/                    # Azure Functions backend
│   └── src/
│       ├── functions/     # HTTP-triggered functions (user profile, scenarios)
│       ├── services/      # Table Storage, user profile, scenarios services
│       └── utils/         # Authentication middleware
├── documentation/          # As-built documentation
│   ├── api-reference.md   # REST API endpoint reference
│   ├── oauth-setup.md     # OAuth provider registration guide
│   ├── user-guide.md      # End-user guide
│   └── ...                # Additional technical docs
├── tests/                  # Unit, integration, and Playwright UI tests
├── scripts/                # Azure infrastructure setup scripts
├── master-plan.md         # Project planning and phases
├── .github/               # GitHub configuration and Copilot instructions
├── staticwebapp.config.json # Azure SWA routing and auth config
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
- **API Reference**: See `documentation/api-reference.md` for REST endpoint specs
- **OAuth Setup**: See `documentation/oauth-setup.md` for provider registration guide
- **User Guide**: See `documentation/user-guide.md` for end-user instructions
- **Privacy Policy**: See `src/privacy.html` for data handling details
- **Copilot Instructions**: See `.github/copilot-instructions.md` for development guidelines
- **Calculations**: See `documentation/calculations.md` for CCS formula documentation

## Authentication Setup

The calculator supports optional sign-in with Microsoft (Entra ID) or GitHub, powered by **Azure Static Web Apps built-in authentication**. Signing in is not required — the calculator works fully offline using browser local storage.

### Quick Setup

1. **Provision Azure resources**
   ```bash
   ./scripts/setup-azure-auth-storage.sh
   ```

2. **Register OAuth providers** (see [`documentation/oauth-setup.md`](documentation/oauth-setup.md) for step-by-step instructions):
   - **Microsoft:** [Azure Portal App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
   - **GitHub:** [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)

3. **Configure application settings** in your Azure Static Web App:
   ```bash
   az staticwebapp appsettings set \
     --name <your-swa-name> \
     --resource-group <your-resource-group> \
     --setting-names \
       AZURE_CLIENT_ID="<microsoft-client-id>" \
       MICROSOFT_PROVIDER_AUTHENTICATION_SECRET="<microsoft-client-secret>" \
       GITHUB_CLIENT_ID="<github-client-id>" \
       GITHUB_PROVIDER_AUTHENTICATION_SECRET="<github-client-secret>" \
       AZURE_STORAGE_CONNECTION_STRING="<storage-connection-string>"
   ```

4. **Deploy** — authentication will be active on the next deployment.

> **Important:** Never commit OAuth secrets to source code. All secrets must be stored as Azure SWA application settings.

## Status
🚀 Phase 8 In Progress: User Authentication & Cloud Storage

Phases 1–7 are complete. Phase 8 features:
- ✅ Backend API (Azure Functions + Table Storage)
- ✅ Frontend authentication module (Microsoft & GitHub OAuth)
- ✅ Cloud storage manager with auto-save and conflict resolution
- ✅ Azure SWA configuration
- ✅ Integration testing
- ✅ Documentation & privacy policy (Phase 8.7)
- ⏳ Production deployment (Phase 8.8)

**Next**: Phase 8.8 — Deploy to Azure Static Web Apps

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
