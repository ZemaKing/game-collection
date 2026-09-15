import { useEffect, useState } from 'react'

export type ViewMode = 'grid' | 'list'

const DEFAULT_VIEW: ViewMode = 'grid'

function getStoredView(storageKey: string): ViewMode {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored === 'grid' || stored === 'list' ? stored : DEFAULT_VIEW
  } catch {
    return DEFAULT_VIEW
  }
}

/**
 * Persists the grid/list view preference to localStorage under
 * `storageKey`, so each listing surface (dashboard, All Items, per-type
 * pages, per-platform pages) remembers its own choice independently until
 * Settings (Phase 25) centralizes preferences. Filter/sort state lives in
 * the URL instead (see `useFilters`), not here.
 */
export function useListingPrefs(storageKey: string) {
  const [view, setView] = useState<ViewMode>(() => getStoredView(storageKey))

  useEffect(() => {
    window.localStorage.setItem(storageKey, view)
  }, [storageKey, view])

  return { view, setView }
}
