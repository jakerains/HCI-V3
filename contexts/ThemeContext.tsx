'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Theme, themes, DEFAULT_THEME } from '@/lib/themes'

type ThemeContextType = {
  theme: Theme;
  setTheme: (themeName: string) => void;
  availableThemes: string[];
  defaultTheme: Theme;
  isDefaultTheme: boolean;
  resetToDefault: () => void;
}

// Ensure the default theme is immutable
const defaultTheme: Readonly<Theme> = Object.freeze({ ...DEFAULT_THEME })

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme)
  const [isDefaultTheme, setIsDefaultTheme] = useState(true)

  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentTheme(themes[themeName])
      setIsDefaultTheme(themeName === 'dark')
      // Update Tailwind's dark mode class
      if (themeName === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const resetToDefault = () => {
    setCurrentTheme(defaultTheme)
    setIsDefaultTheme(true)
    document.documentElement.classList.add('dark')
  }

  // Initialize dark mode class on mount
  useEffect(() => {
    if (isDefaultTheme) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <ThemeContext.Provider value={{
      theme: currentTheme,
      setTheme,
      availableThemes: Object.keys(themes),
      defaultTheme,
      isDefaultTheme,
      resetToDefault
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 