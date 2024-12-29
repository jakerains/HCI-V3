# Theme Creation Prompt for Naval Helm Interface

You are tasked with creating a new theme for a Naval Ship's Helm Command Interface. The interface is built with React, TypeScript, Tailwind CSS, and shadcn/ui. Your goal is to create a cohesive, accessible theme that maintains the professional and technical nature of the application.

## Task Description

Create a new theme object that follows this TypeScript type structure:

```typescript
type Theme = {
  name: string;
  colors: {
    background: string;
    cardBackground: string;
    cardBorder: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  status: {
    ready: string;
    listening: string;
    error: string;
    success: string;
    warning: string;
  };
  indicators: {
    rudder: string;
    speed: string;
    course: string;
  };
  compass: {
    background: string;
    needle: string;
    markers: string;
    text: string;
  };
  fonts: {
    display: string;
    mono: string;
  };
}
```

## Requirements

1. Use only valid Tailwind CSS classes
2. Maintain high contrast ratios for accessibility
3. Create a cohesive color scheme
4. Ensure all text is readable
5. Consider the naval/maritime context
6. Follow shadcn/ui's color system conventions

## Component Context

The theme will be applied to:
- Status displays
- Command log entries
- Compass display
- Engine telegraph
- Rudder angle indicator
- Control buttons
- Cards and containers
- Text elements at various hierarchy levels

## shadcn/ui Integration

The theme should work with shadcn/ui's CSS variable system. Key variables to consider:
- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--primary`
- `--secondary`
- `--muted`
- `--accent`
- `--destructive`

## Example Theme Structure

Here's a partial example to guide your format:

```typescript
{
  name: "Theme Name",
  colors: {
    background: "bg-slate-950",
    cardBackground: "bg-slate-900",
    cardBorder: "border-slate-800",
  },
  text: {
    primary: "text-slate-50",
    secondary: "text-slate-200",
    accent: "text-blue-400",
    muted: "text-slate-400"
  },
  status: {
    ready: "bg-blue-600 text-white",
    listening: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-600 text-white"
  },
  indicators: {
    rudder: "bg-blue-500",
    speed: "text-green-400",
    course: "text-yellow-400"
  },
  compass: {
    background: "bg-slate-800",
    needle: "bg-red-500",
    markers: "text-blue-400",
    text: "text-slate-100"
  },
  fonts: {
    display: "font-display",
    mono: "font-mono"
  }
}
```

## Instructions

1. Provide a theme name that reflects its visual style
2. Use Tailwind's color palette (e.g., slate-900, blue-500)
3. Include hover states where appropriate
4. Consider both light and dark environments
5. Format the response as a complete theme object
6. Add a brief description of your theme's inspiration
7. Ensure compatibility with shadcn/ui components

## Response Format

Please provide your response in this format:

```typescript
// Theme Name: [Your Theme Name]
// Inspiration: [Brief description of theme inspiration]

export const theme: Theme = {
  // Your theme object here
}
```

## Additional Notes

- Use color values that work well in maritime environments
- Consider color-blind accessibility
- Maintain professional appearance
- Ensure status indicators are clearly distinguishable
- Use appropriate contrast for readability
- Test compatibility with shadcn/ui components
- Consider dark/light mode transitions

## Theme Manager Integration

Your theme can be added to the application using the Theme Manager:
1. Navigate to `/theme-manager`
2. Paste your theme code
3. The name will be auto-detected from your theme object
4. Submit to add the theme
5. Restart the application to apply changes

Please create a complete theme object following these guidelines. The theme should be both visually appealing and functional for a naval command interface. 