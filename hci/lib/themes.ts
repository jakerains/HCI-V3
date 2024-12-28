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

// Default Naval Dark theme
const defaultTheme: Theme = {
  name: "Naval Dark",
  colors: {
    background: "bg-gray-950",
    cardBackground: "bg-gray-900",
    cardBorder: "border-gray-800",
  },
  text: {
    primary: "text-gray-50",
    secondary: "text-gray-200",
    accent: "text-blue-400",
    muted: "text-gray-400"
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
    background: "bg-gray-800",
    needle: "bg-red-500",
    markers: "text-blue-400",
    text: "text-gray-100"
  },
  fonts: {
    display: "font-display",
    mono: "font-mono"
  }
}

// Light theme variant
const lightTheme: Theme = {
  name: "Naval Light",
  colors: {
    background: "bg-slate-100",
    cardBackground: "bg-white",
    cardBorder: "border-slate-200",
  },
  text: {
    primary: "text-slate-900",
    secondary: "text-slate-700",
    accent: "text-blue-700",
    muted: "text-slate-500"
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
    speed: "text-emerald-700",
    course: "text-amber-700"
  },
  compass: {
    background: "bg-slate-100",
    needle: "bg-red-700",
    markers: "text-blue-700",
    text: "text-slate-900"
  },
  fonts: {
    display: "font-display",
    mono: "font-mono"
  }
}

export const themes: Record<string, Theme> = {
  dark: defaultTheme,
  light: lightTheme
}

export const DEFAULT_THEME = defaultTheme 