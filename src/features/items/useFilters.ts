import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SORT_KEYS, type SortKey } from '@/features/items/sort'
import { ITEM_CONDITIONS, ITEM_TYPES } from '@/features/items/constants'
import type { ItemCondition, ItemType } from '@/features/items/types'
import { useSettings } from '@/hooks/useSettings'

export interface Filters {
  search: string
  itemTypes: ItemType[]
  platformIds: string[]
  genreIds: string[]
  tagIds: string[]
  editions: string[]
  years: number[]
  conditions: ItemCondition[]
  collectionDateFrom: string | null
  collectionDateTo: string | null
  sort: SortKey
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  itemTypes: [],
  platformIds: [],
  genreIds: [],
  tagIds: [],
  editions: [],
  years: [],
  conditions: [],
  collectionDateFrom: null,
  collectionDateTo: null,
  sort: 'title',
}

const PARAM_KEYS = {
  search: 'q',
  itemTypes: 'type',
  platformIds: 'platform',
  genreIds: 'genre',
  tagIds: 'tag',
  editions: 'edition',
  years: 'year',
  conditions: 'condition',
  collectionDateFrom: 'from',
  collectionDateTo: 'to',
  sort: 'sort',
} as const

function parseFilters(params: URLSearchParams, defaultSort: SortKey): Filters {
  const itemTypes = (params.get(PARAM_KEYS.itemTypes)?.split(',').filter(Boolean) ?? []).filter(
    (v): v is ItemType => (ITEM_TYPES as string[]).includes(v),
  )
  const conditions = (params.get(PARAM_KEYS.conditions)?.split(',').filter(Boolean) ?? []).filter(
    (v): v is ItemCondition => (ITEM_CONDITIONS as string[]).includes(v),
  )
  const years = (params.get(PARAM_KEYS.years)?.split(',').filter(Boolean) ?? [])
    .map(Number)
    .filter((n) => Number.isInteger(n))
  const sortRaw = params.get(PARAM_KEYS.sort)
  const sort = (SORT_KEYS as string[]).includes(sortRaw ?? '') ? (sortRaw as SortKey) : defaultSort

  return {
    search: params.get(PARAM_KEYS.search) ?? '',
    itemTypes,
    platformIds: params.get(PARAM_KEYS.platformIds)?.split(',').filter(Boolean) ?? [],
    genreIds: params.get(PARAM_KEYS.genreIds)?.split(',').filter(Boolean) ?? [],
    tagIds: params.get(PARAM_KEYS.tagIds)?.split(',').filter(Boolean) ?? [],
    editions: params.get(PARAM_KEYS.editions)?.split(',').filter(Boolean) ?? [],
    years,
    conditions,
    collectionDateFrom: params.get(PARAM_KEYS.collectionDateFrom) || null,
    collectionDateTo: params.get(PARAM_KEYS.collectionDateTo) || null,
    sort,
  }
}

function serializeFilters(filters: Filters, preserve: URLSearchParams, defaultSort: SortKey): URLSearchParams {
  const next = new URLSearchParams(preserve)
  next.delete(PARAM_KEYS.search)
  next.delete(PARAM_KEYS.itemTypes)
  next.delete(PARAM_KEYS.platformIds)
  next.delete(PARAM_KEYS.genreIds)
  next.delete(PARAM_KEYS.tagIds)
  next.delete(PARAM_KEYS.editions)
  next.delete(PARAM_KEYS.years)
  next.delete(PARAM_KEYS.conditions)
  next.delete(PARAM_KEYS.collectionDateFrom)
  next.delete(PARAM_KEYS.collectionDateTo)
  next.delete(PARAM_KEYS.sort)

  if (filters.search.trim()) next.set(PARAM_KEYS.search, filters.search.trim())
  if (filters.itemTypes.length) next.set(PARAM_KEYS.itemTypes, filters.itemTypes.join(','))
  if (filters.platformIds.length) next.set(PARAM_KEYS.platformIds, filters.platformIds.join(','))
  if (filters.genreIds.length) next.set(PARAM_KEYS.genreIds, filters.genreIds.join(','))
  if (filters.tagIds.length) next.set(PARAM_KEYS.tagIds, filters.tagIds.join(','))
  if (filters.editions.length) next.set(PARAM_KEYS.editions, filters.editions.join(','))
  if (filters.years.length) next.set(PARAM_KEYS.years, filters.years.join(','))
  if (filters.conditions.length) next.set(PARAM_KEYS.conditions, filters.conditions.join(','))
  if (filters.collectionDateFrom) next.set(PARAM_KEYS.collectionDateFrom, filters.collectionDateFrom)
  if (filters.collectionDateTo) next.set(PARAM_KEYS.collectionDateTo, filters.collectionDateTo)
  if (filters.sort !== defaultSort) next.set(PARAM_KEYS.sort, filters.sort)

  return next
}

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
