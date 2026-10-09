import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_FILTERS, parseFilters, serializeFilters, type Filters } from '@/features/items/filters'
import { useSettings } from '@/hooks/useSettings'

// Re-exported so existing importers keep working; the logic lives in `filters.ts`.
export { DEFAULT_FILTERS }
export type { Filters }

/**
 * Filter/sort state lives entirely in the URL query string, so refreshing
 * or sharing a listing URL restores the exact same results (Phase 11).
 * Grid/list view stays in `useListingPrefs` (localStorage) since it's a
 * display preference, not a query parameter.
 *
 * A URL with no `sort` means "the viewer's default sort" (Settings), so the
 * param is only written when the sort differs from that default — a link
 * shared without one opens in the recipient's own default order.
 */
export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { defaultSort } = useSettings().settings

  const filters = useMemo(() => parseFilters(searchParams, defaultSort), [searchParams, defaultSort])

  function setFilters(partial: Partial<Filters>) {
    setSearchParams(serializeFilters({ ...filters, ...partial }, searchParams, defaultSort), { replace: false })
  }

  function clearAll() {
    setSearchParams(serializeFilters({ ...DEFAULT_FILTERS, sort: defaultSort }, searchParams, defaultSort), {
      replace: false,
    })
  }

  return { filters, setFilters, clearAll }
}
