# Collapsible Sections Feature

## Overview
Implemented collapsible UI sections for parent and child data entry forms to reduce vertical scrolling on mobile and tablet devices while maintaining full accessibility and usability.

## Feature Details

### Responsive Behavior

#### Mobile & Tablet (max-width: 1023px)
- **Auto-collapse**: Sections automatically collapse after data entry to save vertical space
- **Compact summaries**: Show essential information in a single-line or compact grid format
- **Edit buttons**: Clear "Edit +" buttons allow users to re-expand sections
- **Default state**: Sections start expanded for initial data entry

#### Desktop (min-width: 1024px)
- **Always expanded**: Sections remain expanded by default
- **Optional collapse**: Users can manually collapse sections if desired
- **Less prominent buttons**: Collapse buttons are slightly transparent to indicate optional nature

### Parent Section Summaries

When collapsed, parent sections display:
- **Income**: Formatted annual income (e.g., "$100,000")
- **Schedule**: Work days and hours per day (e.g., "5 days × 7.6h")

Example collapsed summary:
```
Income: $100,000    Schedule: 5 days × 7.6h
```

### Child Section Summaries

When collapsed, child card sections display:
- **Age**: Child's age in years
- **Type**: Care type (truncated if too long)
- **Fee**: Daily fee amount
- **Days**: Days of care per week

Example collapsed summary:
```
Age: 3y    Type: Centre-Based...    Fee: $120/day    Days: 5
```

### Auto-Collapse Triggers

#### Parent Sections
- Triggers after income field loses focus (`blur` event)
- Only if income value > 0
- Only on mobile/tablet viewports
- Delayed by 500ms to allow continued data entry

#### Child Sections
- Triggers after age field loses focus (`blur` event)
- Only if age value > 0
- Only on mobile/tablet viewports
- Delayed by 1000ms to allow continued data entry

### Accessibility Features

#### ARIA Attributes
- `aria-expanded`: Indicates current state (true/false)
- `aria-controls`: Links button to controlled content section
- `aria-live="polite"`: Announces summary changes to screen readers
- `aria-atomic="true"`: Ensures complete announcements

#### Keyboard Support
- **Enter**: Toggle collapse/expand
- **Space**: Toggle collapse/expand
- **Tab**: Navigate to collapse button and other form elements
- **Focus management**: Proper focus handling during state changes

#### Screen Reader Support
- Clear button labels ("Collapse" / "Edit")
- State announcements ("Section expanded" / "Section collapsed")
- Live region updates for summary changes
- Semantic HTML structure maintained

### Visual Design

#### Collapse Buttons
- **Color**: Primary teal (`--color-primary`)
- **Hover**: Darker shade with subtle lift effect
- **Focus**: 2px outline for keyboard users
- **Icons**: "−" for collapse, "+" for expand
- **Size**: Touch-friendly 32px minimum height

#### Summary Sections
- **Background**: Light gray (`--color-bg-secondary`)
- **Border radius**: Medium (`--radius-md`)
- **Padding**: Comfortable spacing
- **Animation**: Smooth fade-in effect

#### State Transitions
- **Collapse/Expand**: Smooth animation (250ms)
- **Opacity changes**: Subtle visual feedback
- **No jarring movements**: User-friendly transitions

### Implementation Details

#### Files Created
- `src/js/ui/collapsible-sections.js`: Core collapsible functionality module

#### Files Modified
- `src/app.js`: Import and initialize collapsible sections
- `src/styles.css`: Added CSS for collapsible UI components

#### Key Functions

**`initializeAllCollapses()`**
- Initializes collapsible functionality for all parent and child sections
- Sets up MutationObserver to handle dynamically added children
- Called once on page load

**`initializeParentCollapse(parentNumber)`**
- Sets up collapse functionality for a specific parent section
- Creates toggle button and summary element
- Attaches event listeners for collapse/expand
- Monitors input changes to update summary

**`initializeChildCollapse(childCard)`**
- Sets up collapse functionality for a child card
- Creates toggle button and summary element
- Attaches event listeners for collapse/expand
- Monitors input changes to update summary

**`toggleSection(section, button, content, summary)`**
- Handles the actual collapse/expand logic
- Updates ARIA attributes
- Shows/hides content and summary
- Announces state change to screen readers

**`getParentSummary(parentNumber)`**
- Generates HTML for parent section summary
- Formats currency and schedule data
- Handles empty/incomplete data gracefully

**`getChildSummary(childIndex)`**
- Generates HTML for child card summary
- Formats fee, age, and care type data
- Handles empty/incomplete data gracefully

### Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Breakpoints

```css
/* Mobile: max-width: 1023px */
@media (max-width: 1023px) {
  /* Auto-collapse enabled */
  /* Prominent collapse buttons */
}

/* Desktop: min-width: 1024px */
@media (min-width: 1024px) {
  /* Always expanded by default */
  /* Subtle collapse buttons */
}
```

## Screenshots

### Mobile Views (375px width)
- **Initial state**: https://github.com/user-attachments/assets/936141d4-4f37-4135-804a-9838e460a718
- **Parent collapsed**: https://github.com/user-attachments/assets/ecb7ea9d-f1ab-4131-90a4-ada465a432a3
- **Child collapsed**: https://github.com/user-attachments/assets/5c155dc9-1c93-4d9c-871d-b36c16e9c516
- **With data**: https://github.com/user-attachments/assets/acbaa47d-d6e7-482f-95d7-981fb6ef4d8f

### Tablet View (768px width)
- **Expanded**: https://github.com/user-attachments/assets/baf36fb9-3779-4d85-85a4-af5b6874fff1

### Desktop View (1280px width)
- **Expanded (default)**: https://github.com/user-attachments/assets/d93484a5-c0ff-4c9a-8e5c-1be84e94034c

## User Benefits

1. **Reduced Scrolling**: Significantly less vertical scrolling on mobile/tablet
2. **Better Focus**: Users can focus on one section at a time
3. **Clear Overview**: Collapsed summaries provide quick reference
4. **Flexibility**: Manual control available on all devices
5. **Accessibility**: Full keyboard and screen reader support
6. **Progressive Enhancement**: Works seamlessly with existing features

## Future Enhancements

Potential improvements for future iterations:
- Remember user's collapse preferences in localStorage
- Add "Collapse All" / "Expand All" buttons
- Animate the scroll position when expanding to keep focus
- Add subtle visual indicator for incomplete collapsed sections
- Consider adding section numbers in collapsed view

## Testing Checklist

- [x] Mobile viewport (375px) - auto-collapse works
- [x] Tablet viewport (768px) - auto-collapse works
- [x] Desktop viewport (1280px) - stays expanded
- [x] Keyboard navigation (Enter/Space toggles)
- [x] Currency formatting in summaries
- [x] Summary updates when data changes
- [x] Multiple children handled correctly
- [ ] Screen reader testing (NVDA/JAWS)
- [x] Touch interaction on mobile devices
- [x] No console errors

## Related Files

- Implementation: `src/js/ui/collapsible-sections.js`
- Styles: `src/styles.css` (lines 2020-2177)
- Integration: `src/app.js` (lines 43-46, 99)
- Documentation: `documentation/current_state/collapsible-sections.md`
