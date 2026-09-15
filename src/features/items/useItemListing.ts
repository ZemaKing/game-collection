import { useEffect, useState } from 'react'
import { fetchItems } from '@/features/items/api'
import type { ListingPrefs } from '@/features/items/useListingPrefs'
import type { AllItemRow, ItemType } from '@/features/items/types'

/**
 * Paginated, filtered fetch against the `all_items` view. `fixedItemType`
 * overrides `prefs.itemType` for single-type listing pages (Games,
 * Artbooks, ...) where the type isn't user-selectable.
 */
export function useItemListing(prefs: ListingPrefs, pageSize: number, fixedItemType?: ItemType) {
  const [items, setItems] = useState<AllItemRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)

  const effectiveItemType = fixedItemType ?? prefs.itemType
  const filterKey = `${prefs.status}|${effectiveItemType}|${prefs.platformId}|${prefs.sort}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    // Filters/sort changed: reset pagination during render rather than in an
    // effect (see https://react.dev/learn/you-might-not-need-an-effect).
    setLastFilterKey(filterKey)
    setPage(0)
  }

  const paramsKey = `${filterKey}|${page}`
  const [fetchState, setFetchState] = useState<
    { key: string; status: 'loaded' | 'error'; message?: string } | null
  >(null)

  useEffect(() => {
    let cancelled = false
    fetchItems({
      status: prefs.status,
      itemType: effectiveItemType,
      platformId: prefs.platformId,
      sort: prefs.sort,
      page,
      pageSize,
    })
      .then(({ rows, count }) => {
        if (cancelled) return
        setItems((prev) => (page === 0 ? rows : [...prev, ...rows]))
        setTotalCount(count)
        setFetchState({ key: paramsKey, status: 'loaded' })
      })
      .catch((error: Error) => {
        if (cancelled) return
        setFetchState({ key: paramsKey, status: 'error', message: error.message })
      })
    return () => {
      cancelled = true
    }
    // paramsKey encodes every dependency below; re-run whenever it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  const loading = fetchState?.key !== paramsKey
  const error =
    fetchState?.key === paramsKey && fetchState.status === 'error'
      ? (fetchState.message ?? null)
      : null

  return {
    items,
    totalCount,
    page,
    setPage,
    loading,
    error,
    hasMore: items.length < totalCount,
  }
}
