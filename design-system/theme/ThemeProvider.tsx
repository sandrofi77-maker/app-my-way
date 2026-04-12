import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Theme, ThemeMode, lightTheme, darkTheme } from './theme'

type ThemeContextValue = {
  theme: Theme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = {
  children: React.ReactNode
  defaultMode?: ThemeMode
}

export function ThemeProvider({ children, defaultMode = 'light' }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode)

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo<ThemeContextValue>(() => {
    const theme = mode === 'light' ? lightTheme : darkTheme
    return { theme, mode, setMode, toggleMode }
  }, [mode, toggleMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Safe fallback for components used outside a provider (e.g. in isolation).
    return lightTheme
  }
  return ctx.theme
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    return {
      mode: 'light' as ThemeMode,
      setMode: () => {},
      toggleMode: () => {},
    }
  }
  return { mode: ctx.mode, setMode: ctx.setMode, toggleMode: ctx.toggleMode }
}
