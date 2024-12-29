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

// Naval Light theme
const lightTheme: Theme = {
  name: "Naval Light",
  colors: {
    background: "bg-[hsl(300,0%,88%)]",
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
    speed: "text-emerald-800",
    course: "text-amber-800"
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

export const themes = {
  dark: darkTheme,
  light: lightTheme
} as const

export const DEFAULT_THEME = darkTheme 