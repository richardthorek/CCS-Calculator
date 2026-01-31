# Project Setup Documentation

## Overview
This document describes the initial project structure setup for the CCS Calculator application.

## Created Structure

### Root Level Files
- **master-plan.md**: Central planning document for tracking features, phases, and project status
- **README.md**: Main project documentation and getting started guide
- **staticwebapp.config.json**: Azure Static Web App configuration for routing and security
- **.gitignore**: Git ignore rules for Node.js, Azure Functions, and common development files

### Folders

#### `.github/`
Contains GitHub-specific configuration:
- **copilot-instructions.md**: Instructions for GitHub Copilot to understand project context and guidelines

#### `src/`
Frontend source code folder:
- **index.html**: Main HTML entry point
- **styles.css**: Global CSS styles
- **app.js**: Main JavaScript application file
- **README.md**: Frontend development guidelines

#### `api/`
Azure Functions backend folder:
- **README.md**: Backend development guidelines and setup instructions

#### `documentation/`
As-built documentation folder:
- **README.md**: Documentation organization guidelines
- Future documentation files will be added here as features are built

## Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Designed for Azure Static Web Apps deployment

### Backend
- Azure Functions (Node.js runtime)
- Serverless architecture
- RESTful API endpoints

### Deployment
- Azure Static Web Apps
- Integrated CI/CD via GitHub Actions (to be configured)

## Next Steps

1. **Update master-plan.md** with specific CCS calculator requirements:
   - Define calculation types needed
   - Specify input parameters
   - Outline expected outputs
   - List data sources or formulas

2. **Define technical stack** more specifically:
   - Choose frontend framework (vanilla JS, React, Vue, etc.)
   - Decide on Azure Functions language (Node.js/TypeScript recommended)
   - Identify any third-party libraries needed

3. **Begin development** after planning is complete:
   - Implement core calculator logic
   - Create user interface
   - Develop API endpoints if needed
   - Set up CI/CD pipeline

## Development Workflow

1. Plan features in `master-plan.md`
2. Implement the feature
3. Document in `documentation/` folder
4. Update README if necessary
5. Commit and deploy

## Local Development Setup

Currently, the project is ready for local development. Once package dependencies are defined:

```bash
# Install dependencies
npm install

# Run frontend locally (serve src/ folder)
npx serve src

# Run Azure Functions locally
cd api
func start
```

## Configuration Files

### staticwebapp.config.json
This file configures:
- API routing (routes starting with /api/ go to Azure Functions)
- SPA fallback routing (all other routes serve index.html)
- Security headers
- MIME types

## Notes
- The structure follows Azure Static Web Apps best practices
- The `src/` folder contains the static frontend
- The `api/` folder follows Azure Functions standard structure
- All build artifacts should be excluded via `.gitignore`
