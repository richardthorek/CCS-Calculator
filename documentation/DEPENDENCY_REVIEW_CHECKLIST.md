# Dependency Review Checklist

This checklist should be used whenever adding, updating, or reviewing dependencies in the CCS Calculator project.

## When to Review

- ✅ Before adding any new dependency
- ✅ Quarterly (every 3 months)
- ✅ When security advisories are released
- ✅ Before major version updates

## Review Process

### 1. Security Check
```bash
npm audit
```
- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities
- [ ] All vulnerabilities addressed or documented

### 2. Version Check
```bash
npm outdated
```
- [ ] All packages reviewed for updates
- [ ] Breaking changes documented
- [ ] Update plan created if needed

### 3. Context7 MCP Review

For each package/library:
- [ ] Query Context7 MCP for latest documentation
- [ ] Check for security best practices
- [ ] Review recommended usage patterns
- [ ] Verify compatibility with Node.js 20 LTS
- [ ] Check for deprecated APIs

**Context7 MCP Query Template:**
```
Review [LIBRARY NAME] v[VERSION] usage for:
- Security best practices
- Performance optimization
- Memory leaks and cleanup
- Accessibility features
- Deprecated APIs
- Recommended patterns
```

### 4. Usage Review

For each dependency:
- [ ] Verify necessity (can native APIs achieve the goal?)
- [ ] Check if actively maintained (updated within 6 months)
- [ ] Review project's usage against best practices
- [ ] Document why dependency is needed
- [ ] Verify proper cleanup/disposal patterns

### 5. Test Coverage
```bash
npm run test:coverage
```
- [ ] All tests passing
- [ ] Coverage reviewed for new code
- [ ] Edge cases tested
- [ ] Integration tests updated

### 6. Documentation

- [ ] Update version numbers in all docs
- [ ] Document any breaking changes
- [ ] Update README.md if needed
- [ ] Update master-plan.md
- [ ] Create migration guide if needed

## Current Dependencies

### Production Dependencies
| Package | Version | Last Reviewed | Status | Notes |
|---------|---------|---------------|--------|-------|
| chart.js | 4.5.1 | 2026-01-31 | ✅ Excellent | Used for data visualization |

### Development Dependencies
| Package | Version | Last Reviewed | Status | Notes |
|---------|---------|---------------|--------|-------|
| jest | 30.2.0 | 2026-01-31 | ✅ Excellent | Testing framework |
| @types/jest | 30.0.0 | 2026-01-31 | ✅ Excellent | TypeScript types for Jest |
| concurrently | 9.2.1 | 2026-01-31 | ✅ Excellent | Development tool |
| serve | 14.2.5 | 2026-01-31 | ✅ Excellent | Development server |

## Review History

### 2026-01-31: Comprehensive Code Review
- **Reviewer**: Automated (Context7 MCP)
- **Scope**: All dependencies
- **Result**: Grade A+ (Excellent)
- **Findings**: 0 vulnerabilities, all packages up-to-date
- **Actions**: Fixed version documentation, enhanced CSP
- **Next Review**: 2026-04-30 (Quarterly)
- **Full Report**: `/documentation/code-review-context7-2026-01.md`

## Adding New Dependencies

Before adding a new dependency, answer these questions:

1. **Can native web APIs achieve this?**
   - [ ] Yes → Do NOT add the dependency
   - [ ] No → Continue to question 2

2. **Is the package actively maintained?**
   - [ ] Yes (updated within 6 months) → Continue to question 3
   - [ ] No → Find alternative or build custom solution

3. **Is the package widely adopted and trusted?**
   - [ ] Yes (high NPM downloads, good reputation) → Continue to question 4
   - [ ] No → Evaluate security risk carefully

4. **Does the benefit outweigh the added complexity?**
   - [ ] Yes → Continue to question 5
   - [ ] No → Do not add

5. **Have you reviewed the package with Context7 MCP?**
   - [ ] Yes → Document findings
   - [ ] No → Query Context7 MCP first

6. **Is there a lighter alternative?**
   - [ ] No alternatives available → Proceed with addition
   - [ ] Yes → Evaluate lighter option first

## Documentation Template

When adding a new dependency, document:

```markdown
### [Package Name] v[Version]
**Added**: [Date]
**Reason**: [Why native APIs cannot achieve this goal]
**Context7 Review**: [Summary of Context7 MCP findings]
**Security**: [Security considerations]
**License**: [Package license]
**Alternatives Considered**: [Other options evaluated]
**Usage**: [How/where the package is used]
**Update Process**: [How to update this package]
```

## Next Scheduled Review

**Date**: April 30, 2026 (Quarterly)
**Items to Review**:
- All dependencies for updates
- Security audit (npm audit)
- Context7 MCP review for each package
- Usage patterns verification
- Test coverage analysis
- Documentation updates

---

**Last Updated**: January 31, 2026
**Maintained By**: Development Team
