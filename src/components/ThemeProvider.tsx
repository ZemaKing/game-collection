import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import type { Theme } from '@/features/settings/settings'
import { useSettings } from '@/hooks/useSettings'
import { ThemeContext } from '@/hooks/useTheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings()
  const theme = settings.theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = useCallback((next: Theme) => updateSettings({ theme: next }), [updateSettings])

  const toggleTheme = useCallback(
    () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' }),
    [theme, updateSettings],
  )

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
