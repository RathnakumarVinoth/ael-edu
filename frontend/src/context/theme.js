import { createContext } from 'react'

export const THEME_KEY = 'ael_edu_theme'
export const ThemeContext = createContext(null)

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}
