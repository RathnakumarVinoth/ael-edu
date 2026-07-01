import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

const storedTheme = localStorage.getItem('ael_edu_theme')
document.documentElement.setAttribute('data-theme', storedTheme === 'dark' ? 'dark' : 'light')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
