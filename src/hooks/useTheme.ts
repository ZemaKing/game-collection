import { createContext, useContext } from 'react'
import type { Theme } from '@/features/settings/settings'

export type { Theme }

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Flips between light and dark (used by the topbar button). */
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
