# API Backend

This folder contains Azure Functions for the CCS Calculator backend.

## Structure
- Each function should be in its own folder
- Follow Azure Functions naming conventions
- Include function.json for each function

## Local Development
```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Run functions locally
cd api
func start
```

## Adding New Functions
1. Create a new folder for your function
2. Add function.json with bindings
3. Add your function code (index.js for Node.js)
4. Test locally before deployment
