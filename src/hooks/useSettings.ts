import { createContext, useContext } from 'react'
import type { Settings } from '@/features/settings/settings'

export interface SettingsContextValue {
  settings: Settings
  /** Merges `patch` into the current settings; anything invalid falls back to that field's default. */
  updateSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
