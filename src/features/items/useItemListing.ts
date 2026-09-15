import { useEffect, useState } from 'react'
import { fetchItems } from '@/features/items/api'
import type { ListingPrefs } from '@/features/items/useListingPrefs'
import type { AllItemRow, ItemType } from '@/features/items/types'

/**
 * Paginated, filtered fetch against the `all_items` view. `fixedItemType`
 * and `fixedPlatformId` override the matching `prefs` field for listing
 * pages where that filter isn't user-selectable (single-type pages,
 * per-platform pages).
 */
export function useItemListing(
  prefs: ListingPrefs,
  pageSize: number,
  fixedItemType?: ItemType,
  fixedPlatformId?: string,
) {
  const [items, setItems] = useState<AllItemRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)

  const effectiveItemType = fixedItemType ?? prefs.itemType
  const effectivePlatformId = fixedPlatformId ?? prefs.platformId
  const filterKey = `${effectiveItemType}|${effectivePlatformId}|${prefs.sort}`
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
      itemType: effectiveItemType,
      platformId: effectivePlatformId,
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
