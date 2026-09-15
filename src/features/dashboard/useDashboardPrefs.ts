import { useEffect, useState } from 'react'
import type { SortKey } from '@/features/items/api'
import type { ItemStatus, ItemType } from '@/features/items/types'

export type ViewMode = 'grid' | 'list'

export interface DashboardPrefs {
  view: ViewMode
  sort: SortKey
  status: ItemStatus | 'all'
  itemType: ItemType | 'all'
  platformId: string | 'all'
}

const STORAGE_KEY = 'dashboard.prefs'

const DEFAULT_PREFS: DashboardPrefs = {
  view: 'grid',
  sort: 'recently_added',
  status: 'all',
  itemType: 'all',
  platformId: 'all',
}

function getStoredPrefs(): DashboardPrefs {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_PREFS
  }
}

export function useDashboardPrefs() {
  const [prefs, setPrefsState] = useState<DashboardPrefs>(getStoredPrefs)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  function setPrefs(partial: Partial<DashboardPrefs>) {
    setPrefsState((prev) => ({ ...prev, ...partial }))
  }

  return { prefs, setPrefs }
}
