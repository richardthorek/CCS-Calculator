# GitHub Copilot Instructions for CCS Calculator

## Project Overview
This is a CCS (Carbon Capture and Storage) Calculator - a web application deployed as an Azure Static Web App with Azure Functions for backend processing.

## Architecture
- **Frontend**: Static web application hosted on Azure Static Web Apps
- **Backend**: Azure Functions (serverless) for API endpoints and server-side logic
- **Deployment**: Azure Static Web Apps with integrated CI/CD

## Project Organization
- `master-plan.md`: Contains all planning, current status, and future features
- `documentation/`: Contains all as-built documentation
- Frontend code should be in the root or a `src/` folder
- Backend code should be in an `api/` folder (Azure Functions standard)

## Development Guidelines

### Code Style
- Write clean, maintainable code with clear comments
- Follow modern JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper error handling

### Azure Static Web Apps Specifics
- Frontend files should be in a structure that can be served statically
- Azure Functions should be in the `api/` folder
- Use environment variables for configuration
- Follow Azure Functions best practices for Node.js

### Documentation
- Update `master-plan.md` when adding new features or changing project scope
- Document all completed features in the `documentation/` folder
- Include API documentation for all backend endpoints
- Keep README.md up-to-date with setup and usage instructions

### Testing
- Write unit tests for critical business logic
- Test Azure Functions locally before deployment
- Ensure frontend works across modern browsers

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
- When adding a new feature: Update master-plan.md first, implement, then document in documentation/
- When creating API endpoints: Place in api/ folder, follow Azure Functions structure
- When making architectural changes: Document in documentation/architecture.md
