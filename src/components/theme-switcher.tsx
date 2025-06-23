"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before showing to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Check for existing theme preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else if (systemPrefersDark) {
      setTheme('dark')
      applyTheme('dark')
    } else {
      setTheme('light')
      applyTheme('light')
    }
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const html = document.documentElement
    if (newTheme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-none justify-start w-full h-auto"
    >
      {theme === 'light' ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
      <span className="text-xs">
        {theme === 'light' ? 'Dark' : 'Light'} mode
      </span>
    </Button>
  )
}