# Development Phases Overview

This document provides a high-level overview of the CCS Calculator development phases.

## Phase Summary

### ✅ Phase 1: Project Setup (COMPLETE)
**Status:** Complete  
**Purpose:** Establish project foundation, structure, and planning

**Key Deliverables:**
- Repository structure
- Master plan with detailed phases
- Copilot instructions
- Technical stack definition (Vanilla JS, Node 20 LTS)
- Package.json with minimal dependencies

---

### 🎯 Phase 2: Core Calculation Engine (NEXT)
**Status:** Not started  
**Purpose:** Build the mathematical foundation for CCS calculations

**Sub-phases:**
1. **Income Calculations** - Adjusted income for parents and households
2. **Subsidy Rate Calculations** - CCS percentage based on income brackets
3. **Activity Test** - Calculate subsidised hours based on work patterns
4. **Cost Calculations** - Hourly rates, caps, subsidies, and out-of-pocket costs
5. **Testing & Validation** - Comprehensive tests for all calculation modules

**Key Deliverables:**
- Pure JavaScript calculation modules in `src/js/calculations/`
- Unit tests with >80% coverage
- Documentation of all formulas

**Success Criteria:**
- All calculations produce accurate results
- Edge cases handled properly
- All tests pass
- Code is modular and reusable

---

### Phase 3: Basic User Interface
**Status:** Not started  
**Purpose:** Create a functional calculator interface

**Key Deliverables:**
- Responsive HTML form structure
- CSS styling (WCAG 2.1 compliant)
- Form validation and error handling
- Results display

---

### Phase 4: Scenario Simulation & Comparison
**Status:** Not started  
**Purpose:** Enable multi-scenario comparison

**Key Deliverables:**
- Automatic scenario generation
- Comparison table
- CSV export functionality

---

### Phase 5: Real-Time Interactivity
**Status:** Not started  
**Purpose:** Make the calculator responsive without page refresh

**Key Deliverables:**
- Event-driven updates (Vanilla JS)
- Performance optimization
- Smooth user experience

---

### Phase 6: Enhanced Features
**Status:** Not started  
**Purpose:** Add advanced functionality

**Key Deliverables:**
- Data visualization (charts)
- Export to PDF
- Shareable URLs
- Advanced UI features

---

### Phase 7: Backend Integration (Optional)
**Status:** Not started  
**Purpose:** Add server-side capabilities if needed

**Note:** This phase is optional and may be skipped if all functionality can be achieved client-side.

---

### Phase 8: Testing & Quality Assurance
**Status:** Not started  
**Purpose:** Comprehensive testing across all aspects

**Key Deliverables:**
- Full test suite
- Browser compatibility testing
- Accessibility validation
- User acceptance testing

---

### Phase 9: Documentation & Deployment
**Status:** Not started  
**Purpose:** Deploy to production

**Key Deliverables:**
- User guide
- Technical documentation
- Azure deployment
- CI/CD pipeline

---

### Phase 10: Maintenance & Updates
**Status:** Not started  
**Purpose:** Ongoing maintenance

**Key Deliverables:**
- Annual CCS policy updates
- Bug fixes
- Feature improvements

---

## Development Workflow

### For Each Phase:
1. **Plan** - Review phase tasks in `master-plan.md`
2. **Implement** - Build features following vanilla JS principles
3. **Test** - Write and run tests
4. **Document** - Update documentation
5. **Review** - Update master plan, mark tasks complete [x]
6. **Report** - Commit changes with clear messages

### Master Plan Tracking:
- Look for **🎯 NEXT** marker to find current phase
- Mark completed tasks with **[x]**
- Add new tasks as discovered
- Update status when phase completes
- Move **🎯 NEXT** marker to new phase

### Code Standards:
- Vanilla JavaScript (ES6+) - no frameworks
- Native Web APIs - no unnecessary libraries
- Modular code - separation of concerns
- Well-tested - unit tests for logic
- Well-documented - clear comments and docs

---

## Dependencies Philosophy

**ONLY add a package if:**
1. Native web API doesn't exist or is inadequate
2. Package is actively maintained (< 6 months since last update)
3. Package is widely adopted and trusted
4. Benefit significantly outweighs complexity

**Prefer native solutions:**
- DOM manipulation → `querySelector`, `createElement`
- Events → `addEventListener`, event delegation
- HTTP → `fetch` API
- Storage → `localStorage`, `sessionStorage`
- URLs → `URLSearchParams`
- Export → `Blob`, `URL.createObjectURL`
- Formatting → `Intl.NumberFormat`, `Intl.DateTimeFormat`

---

## Current Status

**Active Phase:** Phase 2 - Core Calculation Engine  
**Next Task:** Create `src/js/calculations/income.js` module

To begin development, check `master-plan.md` for detailed task list in Phase 2.1.
