import { useEffect, useState } from 'react'
import type { SortKey } from '@/features/items/api'
import type { ItemStatus, ItemType } from '@/features/items/types'

export type ViewMode = 'grid' | 'list'

export interface ListingPrefs {
  view: ViewMode
  sort: SortKey
  status: ItemStatus | 'all'
  itemType: ItemType | 'all'
  platformId: string | 'all'
}

const DEFAULT_PREFS: ListingPrefs = {
  view: 'grid',
  sort: 'recently_added',
  status: 'all',
  itemType: 'all',
  platformId: 'all',
}

function getStoredPrefs(storageKey: string, defaults: ListingPrefs): ListingPrefs {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return defaults
    return { ...defaults, ...JSON.parse(stored) }
  } catch {
    return defaults
  }
}

/**
 * Persists grid/list view, sort, and filter selections to localStorage under
 * `storageKey`, so each listing surface (dashboard, All Items, per-type
 * pages) remembers its own choices independently until Settings (Phase 25)
 * centralizes preferences.
 */
export function useListingPrefs(storageKey: string, fixedItemType?: ItemType) {
  const defaults: ListingPrefs = fixedItemType
    ? { ...DEFAULT_PREFS, itemType: fixedItemType }
    : DEFAULT_PREFS

  const [prefs, setPrefsState] = useState<ListingPrefs>(() => getStoredPrefs(storageKey, defaults))

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(prefs))
  }, [storageKey, prefs])

  function setPrefs(partial: Partial<ListingPrefs>) {
    setPrefsState((prev) => ({ ...prev, ...partial }))
  }

  return { prefs, setPrefs }
}
