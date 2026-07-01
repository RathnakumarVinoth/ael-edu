import { useEffect, useMemo, useState } from 'react'
import { THEME_KEY, ThemeContext, getStoredTheme } from './theme'

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme)

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme === 'dark' ? 'dark' : 'light')
  }

  const toggleTheme = () => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
