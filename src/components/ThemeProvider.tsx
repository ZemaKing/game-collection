import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ThemeContext,
  type ResolvedTheme,
  type Theme,
} from '@/hooks/useTheme'

const STORAGE_KEY = 'theme'
const DEFAULT_THEME: Theme = 'dark'

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function getStoredTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system'
    ? stored
    : DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const listener = () => setSystemTheme(getSystemTheme())
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      resolvedTheme === 'dark',
    )
  }, [resolvedTheme])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}
