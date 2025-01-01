export type Theme = {
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

// Naval Dark theme
const darkTheme: Theme = {
  name: "Naval Dark",
  colors: {
    background: "bg-background",
    cardBackground: "bg-card",
    cardBorder: "border-border",
  },
  text: {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    accent: "text-accent-foreground",
    muted: "text-muted"
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
    background: "bg-card",
    needle: "bg-red-500",
    markers: "text-blue-400",
    text: "text-foreground"
  },
  fonts: {
    display: "font-display",
    mono: "font-mono"
  }
}

// Naval Light theme
const lightTheme: Theme = {
  name: "Naval Light",
  colors: {
    background: "bg-background",
    cardBackground: "bg-card",
    cardBorder: "border-border",
  },
  text: {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    accent: "text-accent-foreground",
    muted: "text-muted"
  },
  status: {
    ready: "bg-blue-600 text-white",
    listening: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-600 text-white"
  },
  indicators: {
    rudder: "bg-blue-700",
    speed: "text-emerald-800",
    course: "text-amber-800"
  },
  compass: {
    background: "bg-card",
    needle: "bg-red-700",
    markers: "text-blue-700",
    text: "text-foreground"
  },
  fonts: {
    display: "font-display",
    mono: "font-mono"
  }
}

export const themes = {
  dark: darkTheme,
  light: lightTheme
} as const

export const DEFAULT_THEME = darkTheme 