# CI Quality Gate – Contributor Guide

## Overview

The deployment workflow includes a **Test and Quality Gate** job that must pass before any code is deployed to Azure Static Web Apps. This ensures no regressions or lint errors reach production.

### Workflow Jobs (in order)

```
test_and_quality  ──►  build_and_deploy_job
```

If `test_and_quality` fails, `build_and_deploy_job` is skipped automatically and the deployment does **not** proceed.

---

## What the Quality Gate Checks

| Check | Command | Description |
|-------|---------|-------------|
| Lint | `npm run lint` | Code style and static analysis |
| Unit tests | `npm test` | Jest unit tests in `tests/**/*.test.js` |

---

## How to Fix Failing Checks

### 1. Run Checks Locally First

Always verify your changes pass locally before pushing:

```bash
# Install dependencies
npm ci

# Run lint
npm run lint

# Run unit tests
npm test

# Run tests with coverage report
npm run test:coverage
```

### 2. Fixing Lint Failures

If `npm run lint` fails, the output will show which files and rules are violated.

- Review the lint output for specific file paths and rule names.
- Fix the flagged code according to the project's coding standards (see [README](../README.md)).
- Re-run `npm run lint` until it exits with code 0.

> **Note:** Lint is currently configured as a pass-through (`echo ... && exit 0`). When a real linter is configured, update this section with linter-specific instructions.

### 3. Fixing Unit Test Failures

If `npm test` fails:

1. Read the Jest output carefully — it shows which test file and assertion failed.
2. Locate the failing test in the `tests/` directory.
3. Fix the underlying code **or** update the test if the expected behaviour has intentionally changed.
4. Run `npm test` again to confirm all tests pass.

Common test locations:
- `tests/calculations/` — CCS calculation logic
- `tests/storage/` — StorageManager and local/cloud storage
- `tests/integration/` — Auth and storage integration tests
- `tests/ui/` — Playwright UI tests (run with `npm run test:ui`)
- `tests/fixtures/` — Shared test fixtures

### 4. Running Playwright UI Tests

Playwright tests are **not** part of the automated CI gate (they require a running browser). To run them locally:

```bash
npm run test:ui
```

---

## Viewing CI Results

1. Open the **Actions** tab in GitHub: `https://github.com/richardthorek/CCS-Calculator/actions`
2. Click the latest workflow run for your branch.
3. Click the **Test and Quality Gate** job to expand the logs.
4. The step that failed will show a red ✗ with the full error output.

---

## What Happens When the Quality Gate Fails

- The `build_and_deploy_job` step is **skipped** (shown as grey in the GitHub Actions UI).
- The workflow run is marked as **failed**.
- No code is deployed to Azure.
- A clear log message is printed in the failed step indicating the reason (lint failure or test failure).

---

## Related Documentation

- [Project Setup](project-setup.md)
- [Phase 8 Checklist](phase-8-checklist.md)
- [Phase 8.6 Testing Report](phase-8-6-testing-report.md)
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
