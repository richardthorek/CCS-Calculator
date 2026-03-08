# Controls Bar: Single-Row Adjust Days Layout

## Overview

The controls bar (located at the top of the results column) has been refactored to place all "Adjust Days Per Week" controls on a single horizontal row directly beneath the "Show Figures" period selector options.

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ SHOW FIGURES:  [Weekly] [Fortnightly] [Monthly] [Annual]    │
│ ADJUST DAYS PER WEEK: [Parent 1: 5] [Set All: _] [Child 1: 5] │
└─────────────────────────────────────────────────────────────┘
```

### Before (Old Layout)
- Period selector and adjustable panel displayed **side-by-side** in a flex row
- Adjustable panel had two separate rows: parent controls + children controls
- Panel controls were not rendered on initial page load (bug: `updatePanelControls()` was called before the panel was in the DOM)

### After (New Layout)
- Controls bar is now a **flex column** — period selector on top, adjustable panel below
- All controls (Parent 1, Parent 2 if applicable, Set All, Child 1, Child 2, ...) appear on a **single horizontal row**
- Controls render correctly on initial page load

## Screenshots

### Desktop (1280px)

![Desktop layout after refactor](https://github.com/user-attachments/assets/d7813843-0bcc-4358-b180-3131887d2d8d)

### Mobile (390px)

![Mobile layout after refactor](https://github.com/user-attachments/assets/eac0ff08-7a7b-4530-8714-23383a968bcb)

## Files Changed

| File | Change |
|------|--------|
| `src/js/ui/adjustable-variables-panel.js` | Merged parent-row and children-row into a single `panel-row`; fixed initialisation order so `updatePanelControls()` is called after panel is in the DOM |
| `src/styles.css` | `.controls-bar` → `flex-direction: column`; `.adjustable-variables-panel` → `flex-direction: row`; `.panel-controls` → `flex: 1`; updated responsive breakpoints |
| `documentation/adjustable-variables-panel.md` | Updated layout description and CSS class documentation |

## Acceptance Criteria Met

- ✅ All days-per-week controls appear on a single row beneath the period selector
- ✅ Each control has a visible label (Parent 1, Set All, Child 1, etc.)
- ✅ "Set All" button does not push other controls out of alignment — all controls share the same row with uniform `flex-wrap` spacing
- ✅ Reduced overall vertical height compared to the previous two-row layout
- ✅ Responsive: mobile (≤640px) switches the label to its own line above the controls row

## Keyboard Accessibility

- All inputs are standard `<input type="number">` elements with `<label>` elements linked via `for`/`id` attributes
- Tab order follows left-to-right visual order (Parent 1 → Set All → Child 1 → ...)
- Focus styles intact (blue ring on focused input)
