import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_SETTINGS,
  getBrowserStorage,
  loadSettings,
  parseSettings,
  saveSettings,
  serializeSettings,
  SETTINGS_STORAGE_KEY,
  type Settings,
} from '@/features/settings/settings'
import { SettingsContext } from '@/hooks/useSettings'

/**
 * Owns every persisted display preference in one localStorage entry. Theme and
 * language providers read from here, so a change made anywhere (Settings page,
 * topbar toggles) has one source of truth and survives refresh and sign-in —
 * settings are per-device and never tied to the auth session.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(getBrowserStorage()))

  useEffect(() => {
    saveSettings(getBrowserStorage(), settings)
  }, [settings])

  // Keep other open tabs in step: `storage` only fires for changes made elsewhere.
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== SETTINGS_STORAGE_KEY && event.key !== null) return
      const next = loadSettings(getBrowserStorage())
      setSettings((current) => (serializeSettings(current) === serializeSettings(next) ? current : next))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => parseSettings({ ...current, ...patch }))
  }, [])

  const resetSettings = useCallback(() => setSettings(parseSettings(DEFAULT_SETTINGS)), [])

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
