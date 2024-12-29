import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/ThemeContext"
import { Moon, Sun } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme.name === "Naval Dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 w-8 h-8 rounded-full opacity-50 hover:opacity-100 transition-opacity"
      title={theme.name === "Naval Dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme.name === "Naval Dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
} 