import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/useTheme'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'is-dark' : ''} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {isDark ? <Moon size={15} /> : <Sun size={15} />}
        </span>
      </span>
      <span className="theme-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}
