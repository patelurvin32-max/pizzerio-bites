import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [accent, setAccent] = useState(() => localStorage.getItem('pb_admin_accent') || 'orange')

  useEffect(() => {
    localStorage.setItem('pb_admin_accent', accent)
    document.documentElement.dataset.accent = accent
  }, [accent])

  const value = useMemo(() => ({ accent, setAccent }), [accent])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
