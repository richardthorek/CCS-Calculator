# Adjustable Variables Panel

## Overview
The Adjustable Variables Panel is a compact, linked control interface positioned next to the period selector in the results column. It provides quick access to the most frequently adjusted parameters without requiring users to scroll through the full form.

## Adjustable Parameters

### Always Visible
- **Parent 1 Days/Week**: Days per week that Parent 1 works (0-5)
- **Child 1+ Days/Week**: Days per week each child is in care (0-5)

### Conditionally Visible
- **Parent 2 Days/Week**: Only appears when Parent 2 has entered an income value greater than 0

## Architecture

### Module: `src/js/ui/adjustable-variables-panel.js`

**Key Functions:**
- `initializeAdjustableVariablesPanel()` - Main initialization function
- `updatePanelControls()` - Rebuild panel based on form state
- `setupPanelEventListeners()` - Handle panel input changes
- `setupFormSyncListeners()` - Listen for form field changes
- `syncPanelWithForm()` - Sync panel input with form field
- `setupChildrenObserver()` - Monitor child addition/removal
- `debounceStructuralUpdate()` - Debounced panel restructuring

### HTML Structure
```html
<div class="controls-bar">
    <div id="global-period-selector"><!-- Period selector --></div>
    <div id="adjustable-variables-container"><!-- Adjustable panel --></div>
</div>
```

### CSS Classes
- `.controls-bar` - Container for period selector and adjustable panel
- `.adjustable-variables-panel` - Main panel wrapper
- `.panel-title` - "Adjust" title
- `.panel-controls` - Grid container for control groups
- `.panel-input-control` - Individual control group (label + input)
- `.panel-input` - Number input field
- `.panel-input-label` - Control label

## Bidirectional Sync

### Panel → Form
When a user modifies a panel control:
1. Panel input change detected
2. Linked form field ID retrieved from `data-linked-to` attribute
3. Form field value updated
4. Both `input` and `change` events dispatched on form field
5. Form-handler recalculation triggered (debounced)

### Form → Panel
When form field changes:
1. Form change listener detects update
2. Panel control ID mapped from field ID
3. Panel input value updated
4. No events dispatched to avoid loops

## Dynamic Behavior

### Parent 2 Visibility
- Parent 2 control appears when `parent2-income` value > 0
- Disappears when value <= 0
- Checked on form `input` and `change` events
- Debounced (300ms) to avoid rapid re-renders

### Child Count Updates
- MutationObserver watches `#children-container` for additions/removals
- Panel controls regenerated when structure changes
- Debounced (100ms) to avoid multiple rapid updates
- Children labeled sequentially: "Child 1", "Child 2", etc.

## Responsive Design

### Desktop (≥960px)
- Panel controls in 2-column grid
- Panel displays horizontally next to period selector
- Title and controls side-by-side

### Tablet/Mobile (≤640px)
- Panel controls in 2-column grid (space-efficient)
- Controls bar stacks vertically
- Full-width layout

## Data Linkage Mapping

| Panel Control ID | Form Field ID | Purpose |
|---|---|---|
| `panel-parent1-days` | `parent1-days` | Parent 1 work days |
| `panel-parent2-days` | `parent2-days` | Parent 2 work days |
| `panel-child-{N}-days` | `child-{N}-days-of-care` | Child care days |

## Performance Considerations

1. **Event Delegation**: Uses container listeners to avoid multiple listeners
2. **Debouncing**: 
   - Structural updates: 300ms delay (parent2 visibility)
   - Child observer: 100ms delay (add/remove children)
   - Prevents recursive event loops
3. **Conditional Rendering**: Only shows relevant controls based on form state
4. **DOM Minimization**: Only updates changed controls

## Integration Points

### Initialization (app.js)
```javascript
import { initializeAdjustableVariablesPanel } 
  from './js/ui/adjustable-variables-panel.js';

// After form initialization
initializeAdjustableVariablesPanel();
```

### Form-Handler Integration
Already integrated via event listeners:
- Listens for form field changes
- Syncs panel controls
- No modifications to existing form-handler code needed

### Communication with Form-Handler
- Form-handler listens for form field changes via event delegation
- Panel changes trigger calculations via form events
- No direct imports between modules (loose coupling)

## Browser Compatibility
- Standard ES6 JavaScript (no polyfills needed)
- Uses native DOM APIs (querySelector, MutationObserver, events)
- Tested on modern browsers (Chrome, Firefox, Safari, Edge)

## Future Enhancements
- Add keyboard shortcuts for focus navigation
- Consider animation transitions between states
- Add tooltips for control purposes
- Persist panel state to localStorage
- Add undo/redo for quick adjustments
