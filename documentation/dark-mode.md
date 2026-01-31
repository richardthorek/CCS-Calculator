# Dark Mode Feature Documentation

## Overview
The CCS Calculator now includes a comprehensive dark mode feature that provides a comfortable viewing experience in low-light environments while maintaining the professional, trustworthy design of the application.

## Features

### Three-State Theme System
The theme toggle supports three states that cycle in order:
1. **Auto (System)** - Automatically follows the user's system/browser preference
2. **Light** - Forces light mode regardless of system preference
3. **Dark** - Forces dark mode regardless of system preference

### User Interface
- **Location**: Theme toggle button is located in the top-right corner of the header
- **Icon**: Shows ☀️ (sun) for light mode, 🌙 (moon) for dark mode
- **Label**: Displays current state (e.g., "Auto (Light)", "Light", "Dark")
- **Interaction**: Click to cycle through the three states

### Persistence
- User's theme preference is saved to `localStorage` under the key `ccsThemePreference`
- Theme is automatically restored when the page is reloaded
- Works seamlessly with the existing form data persistence

### System Preference Detection
- When in "Auto" mode, the application listens for the system's `prefers-color-scheme` media query
- Automatically switches between light and dark mode when system preference changes
- No page reload required for system preference changes

## Technical Implementation

### Files Modified/Created
1. **`src/js/ui/theme-toggle.js`** (NEW)
   - Core theme toggle module
   - Handles theme state management
   - Provides initialization and toggle functions
   
2. **`src/styles.css`** (MODIFIED)
   - Added dark mode CSS variables (400+ lines)
   - Comprehensive dark mode styling for all components
   - Maintains WCAG 2.1 AA contrast compliance

3. **`src/app.js`** (MODIFIED)
   - Imports theme toggle module
   - Initializes theme before DOM loads to prevent flash
   - Integrates theme toggle button

4. **`src/index.html`** (MODIFIED)
   - Added theme toggle button to header
   - Added header-top container for button positioning

### Color Palette

#### Dark Mode Colors
- **Background**: Deep slate (`#0f172a`, `#1e293b`, `#334155`)
- **Text**: Light gray to white (`#f1f5f9`, `#cbd5e1`, `#64748b`)
- **Primary**: Bright cyan (`#22d3ee`, `#06b6d4`)
- **Success**: Vibrant green (`#10b981`, `#34d399`)
- **Accent**: Warm yellow (`#fbbf24`, `#fcd34d`)
- **Borders**: Medium gray (`#475569`)

#### Design Principles
- Reduced eye strain in low-light environments
- Maintained brand colors with adjusted brightness
- Enhanced contrast for better readability
- Smooth transitions between themes

### Components Styled
All UI components have been optimized for dark mode:
- Form inputs and controls
- Buttons (primary, secondary, tertiary)
- Cards and sections
- Tables and comparison views
- Charts and data visualizations
- Header and footer
- Trust banners and notifications
- Tooltips and modals
- Scenario cards
- Results displays

### Accessibility

#### WCAG 2.1 AA Compliance
- All text meets minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Focus states remain visible in both themes
- Color is not the only means of conveying information

#### Keyboard Navigation
- Theme toggle is fully keyboard accessible
- Tab order is logical and consistent
- Focus indicators are clearly visible

#### Screen Reader Support
- Theme toggle includes appropriate ARIA labels
- Current theme state is announced when changed
- All interactive elements have proper labels

### Performance
- Theme is applied before page render to prevent flash of unstyled content
- CSS variables enable instant theme switching
- No additional HTTP requests required
- Minimal JavaScript overhead (~200 lines)

## User Benefits

1. **Reduced Eye Strain**: Darker colors in low-light environments reduce eye fatigue
2. **Battery Savings**: OLED displays use less power with dark mode
3. **Personal Preference**: Users can choose their preferred viewing experience
4. **Automatic Adaptation**: Follows system preferences when in Auto mode
5. **Consistent Experience**: Theme preference persists across sessions

## Browser Support

### Full Support
- Chrome/Edge 76+
- Firefox 67+
- Safari 12.1+
- Opera 62+

### Feature Detection
- Gracefully degrades if `localStorage` is unavailable
- Falls back to light mode if `prefers-color-scheme` is not supported
- All core functionality works without dark mode support

## Testing

### Manual Testing
✅ Theme toggle cycles correctly (Auto → Light → Dark → Auto)
✅ Theme persists across page reloads
✅ System preference detection works in Auto mode
✅ All UI components render correctly in both modes
✅ Smooth transitions between themes
✅ No flash of unstyled content on page load
✅ Meta theme-color updates correctly
✅ Works with all existing features (forms, charts, tables)

### Automated Testing
- All 280 existing tests pass with dark mode implementation
- No regressions introduced

### Accessibility Testing
- Keyboard navigation tested
- Screen reader compatibility verified
- Color contrast verified using browser DevTools

## Future Enhancements

Potential improvements for future releases:
- Add custom color theme options
- Implement scheduled theme switching (e.g., auto-dark after sunset)
- Add theme preview in settings
- Create high-contrast mode for accessibility
- Add animation preferences sync with reduced motion settings

## Maintenance

### Updating Colors
All color variables are defined in `:root` and `:root.dark-mode` in `src/styles.css`. To update theme colors:

1. Locate the color variables (lines 7-98 for light mode, added section for dark mode)
2. Update the desired color values
3. Test both themes for contrast and consistency
4. Verify WCAG compliance using contrast checker tools

### Adding New Components
When adding new UI components:

1. Use existing CSS variables for colors
2. Test the component in both light and dark modes
3. Add specific dark mode overrides if needed under `.dark-mode` selector
4. Verify accessibility and contrast ratios

### Browser Testing
Test theme changes in:
- Latest Chrome/Edge
- Latest Firefox
- Latest Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Support

For issues or questions about dark mode:
1. Check that browser supports `localStorage` and `matchMedia`
2. Verify theme preference is saved in DevTools > Application > Local Storage
3. Test in incognito/private mode to rule out extension conflicts
4. Clear browser cache if theme appears stuck

## Changelog

### Version 1.0 (January 2026)
- Initial dark mode implementation
- Three-state theme system (Auto/Light/Dark)
- Comprehensive styling for all components
- System preference detection
- localStorage persistence
- WCAG 2.1 AA compliance
