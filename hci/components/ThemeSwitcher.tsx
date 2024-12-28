import { Button } from "@/components/ui/button"
import { themes } from "@/lib/themes"
import { useTheme } from "@/contexts/ThemeContext"
import { Monitor, Moon, Sun, RotateCcw } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme, isDefaultTheme, resetToDefault } = useTheme()

  const toggleTheme = () => {
    const currentThemeName = Object.keys(themes).find(key => themes[key].name === theme.name)
    const themeNames = Object.keys(themes)
    const currentIndex = themeNames.indexOf(currentThemeName || 'dark')
    const nextIndex = (currentIndex + 1) % themeNames.length
    setTheme(themeNames[nextIndex])
  }

  return (
    <div className="fixed top-4 right-4 flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="w-9 h-9 rounded-full"
        title={`Current: ${theme.name}`}
      >
        {theme.name === "Naval Dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
      {!isDefaultTheme && (
        <Button
          variant="ghost"
          size="icon"
          onClick={resetToDefault}
          className="w-9 h-9 rounded-full"
          title="Reset to Default Theme"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 