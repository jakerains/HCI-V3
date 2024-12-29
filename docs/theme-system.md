# Naval Helm Interface Theme System Documentation

## Overview
The theme system is built using Tailwind CSS classes and shadcn/ui's color system, providing a complete styling solution for the Naval Helm Interface. Each theme is a collection of color schemes, typography settings, and component-specific styles.

## Theme Structure
A theme consists of the following main components:

### Basic Properties
- `name`: The display name of the theme
- `colors`: Base color-related classes
  - `background`: Main application background
  - `cardBackground`: Background for card components
  - `cardBorder`: Border color for cards

### Text Colors (Root Level)
- `text`: Object containing text-related classes
  - `primary`: Main text color
  - `secondary`: Less prominent text
  - `accent`: Highlighted or important text
  - `muted`: Subdued text elements

### Status Colors (Root Level)
- `status`: Object containing status-related classes
  - `ready`: Default state
  - `listening`: Active/recording state
  - `error`: Error conditions
  - `success`: Successful operations
  - `warning`: Warning states

### Indicators (Root Level)
- `indicators`: Object containing indicator-related classes
  - `rudder`: Rudder position indicator
  - `speed`: Engine speed display
  - `course`: Course/heading display

### Compass (Root Level)
- `compass`: Object containing compass-related classes
  - `background`: Compass background
  - `needle`: Direction needle
  - `markers`: Cardinal direction markers
  - `text`: Compass text elements

### Typography
- `fonts`: Object containing typography-related classes
  - `display`: Main display font
  - `mono`: Monospace font for technical data

## Implementation Details

### Integration with shadcn/ui
The theme system integrates with shadcn/ui's color system, which uses CSS variables for dynamic theming. These variables are defined in `globals.css` and include:
- Base colors (background, foreground)
- Component colors (card, popover, primary, secondary)
- State colors (muted, accent, destructive)
- UI element colors (border, input, ring)
- Chart colors for data visualization

### Class Structure
All classes should be valid Tailwind CSS classes. Examples:
- Colors: `bg-gray-900`, `text-blue-400`
- Typography: `font-mono`, `font-display`
- States: `hover:bg-opacity-90`

### Theme Application
Themes are applied using React's context system:
1. `ThemeProvider` wraps the application
2. `useTheme` hook provides access to the current theme
3. Theme classes are applied using template literals

### Example Usage
```tsx
const MyComponent = () => {
  const { theme } = useTheme();
  return (
    <div className={`${theme.colors.cardBackground} ${theme.text.primary}`}>
      Content
    </div>
  );
}
```

## Theme Management

### Theme Manager UI
The application includes a Theme Manager interface (`/theme-manager`) that allows:
- Adding new themes
- Previewing theme changes
- Auto-detection of theme names from pasted code
- Validation of theme structure
- Real-time theme switching

### Adding New Themes
1. Navigate to the Theme Manager page
2. Paste your theme object in the code editor
3. The theme name will be auto-detected
4. Submit to add the theme
5. Restart the application to apply changes

## Best Practices

1. **Color Consistency**
   - Maintain consistent contrast ratios
   - Use complementary colors for indicators
   - Ensure readability in all states
   - Follow shadcn/ui's color system conventions

2. **Responsive Design**
   - Include hover states where appropriate
   - Consider dark/light mode variations
   - Test at different screen sizes

3. **Performance**
   - Use Tailwind's built-in classes when possible
   - Avoid custom CSS unless necessary
   - Keep theme definitions minimal

## Testing Themes

1. Visual Testing
   - Check all component states
   - Verify text contrast
   - Test responsive behavior
   - Validate dark/light mode transitions

2. Functional Testing
   - Verify theme switching
   - Check component transitions
   - Validate all interactive elements
   - Test theme persistence

## Theme Switching
The application includes a theme switcher component that allows users to:
- Toggle between available themes
- Reset to the default theme
- See visual indicators of the current theme
- Persist theme preferences 