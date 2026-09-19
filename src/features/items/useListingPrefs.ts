import { useCallback, useState } from 'react'
import { getBrowserStorage, type ViewMode } from '@/features/settings/settings'
import { useSettings } from '@/hooks/useSettings'

export type { ViewMode }

function getStoredView(storageKey: string): ViewMode | null {
  try {
    const stored = getBrowserStorage()?.getItem(storageKey)
    return stored === 'grid' || stored === 'list' ? stored : null
  } catch {
    return null
  }
}

/**
 * Grid/list view for one listing surface (dashboard, All Items, per-type and
 * per-platform pages). Each surface remembers the view last picked *on it*
 * under `storageKey`; until you pick one, it falls back to the default view
 * from Settings. A choice is only stored when made — merely visiting a page
 * never pins it, so changing the Settings default keeps applying to pages
 * you haven't changed. Filter/sort state lives in the URL (see `useFilters`).
 */
export function useListingPrefs(storageKey: string) {
  const { settings } = useSettings()
  const [choice, setChoice] = useState(() => ({ key: storageKey, view: getStoredView(storageKey) }))

  // The same mounted page can be handed a new key (platform → platform); re-read
  // that surface's own stored choice instead of carrying the previous one over.
  let current = choice
  if (choice.key !== storageKey) {
    current = { key: storageKey, view: getStoredView(storageKey) }
    setChoice(current)
  }

  const setView = useCallback(
    (next: ViewMode) => {
      setChoice({ key: storageKey, view: next })
      try {
        getBrowserStorage()?.setItem(storageKey, next)
      } catch {
        // Blocked/full storage: the choice still applies until the page unmounts.
      }
    },
    [storageKey],
  )

  return { view: current.view ?? settings.viewMode, setView }
}
