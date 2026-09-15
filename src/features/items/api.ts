import { supabase } from '@/lib/supabaseClient'
import { ITEM_TYPES } from '@/features/items/constants'
import type { AllItemRow, Genre, ItemCondition, ItemType, Platform } from '@/features/items/types'

export async function fetchPlatforms(): Promise<Platform[]> {
  const { data, error } = await supabase.from('platforms').select('id, name, slug').order('name')
  if (error) throw error
  return data
}

export async function fetchGenres(): Promise<Genre[]> {
  const { data, error } = await supabase.from('genres').select('id, name, slug').order('name')
  if (error) throw error
  return data
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('id, name, slug').order('name')
  if (error) throw error
  return data
}

/** Distinct release years present in the collection, newest first. */
export async function fetchAvailableYears(): Promise<number[]> {
  const { data, error } = await supabase
    .from('all_items')
    .select('release_date')
    .not('release_date', 'is', null)
  if (error) throw error

  const years = new Set<number>()
  for (const row of data ?? []) {
    if (row.release_date) years.add(new Date(row.release_date).getFullYear())
  }
  return Array.from(years).sort((a, b) => b - a)
}

export type SortKey = 'recently_added' | 'title' | 'release_date' | 'last_updated'

const SORT_COLUMNS: Record<SortKey, { column: string; ascending: boolean }> = {
  recently_added: { column: 'created_at', ascending: false },
  title: { column: 'title', ascending: true },
  release_date: { column: 'release_date', ascending: false },
  last_updated: { column: 'updated_at', ascending: false },
}

export const SORT_KEYS: SortKey[] = ['recently_added', 'title', 'release_date', 'last_updated']

export interface FetchItemsParams {
  itemTypes: ItemType[]
  platformIds: string[]
  genreIds: string[]
  tagIds: string[]
  years: number[]
  conditions: ItemCondition[]
  collectionDateFrom: string | null
  collectionDateTo: string | null
  sort: SortKey
  page: number
  pageSize: number
}

export interface FetchItemsResult {
  rows: AllItemRow[]
  count: number
}

/**
 * Resolves the genre/tag facets to a restricted set of item ids (intersected
 * when both facets are active), since neither can be expressed as a column
 * filter directly against the polymorphic/joined `all_items` view. Returns
 * `null` when neither facet is active (no restriction needed).
 */
async function resolveGenreTagRestriction(
  genreIds: string[],
  tagIds: string[],
): Promise<string[] | null> {
  if (!genreIds.length && !tagIds.length) return null

  let genreItemIds: Set<string> | null = null
  if (genreIds.length) {
    const { data, error } = await supabase
      .from('game_genres')
      .select('game_id')
      .in('genre_id', genreIds)
    if (error) throw error
    genreItemIds = new Set((data ?? []).map((r) => r.game_id))
  }

  let tagItemIds: Set<string> | null = null
  if (tagIds.length) {
    const { data, error } = await supabase.from('item_tags').select('item_id').in('tag_id', tagIds)
    if (error) throw error
    tagItemIds = new Set((data ?? []).map((r) => r.item_id))
  }

  if (genreItemIds && tagItemIds) {
    return Array.from(genreItemIds).filter((id) => tagItemIds.has(id))
  }
  return Array.from(genreItemIds ?? tagItemIds ?? [])
}

export async function fetchItems(params: FetchItemsParams): Promise<FetchItemsResult> {
  const restriction = await resolveGenreTagRestriction(params.genreIds, params.tagIds)
  if (restriction && restriction.length === 0) return { rows: [], count: 0 }

  const { column, ascending } = SORT_COLUMNS[params.sort]
  let query = supabase.from('all_items').select('*', { count: 'exact' })

  if (params.itemTypes.length) query = query.in('item_type', params.itemTypes)
  if (params.platformIds.length) query = query.in('platform_id', params.platformIds)
  if (params.conditions.length) query = query.in('condition', params.conditions)
  if (params.collectionDateFrom) query = query.gte('collection_date', params.collectionDateFrom)
  if (params.collectionDateTo) query = query.lte('collection_date', params.collectionDateTo)
  if (restriction) query = query.in('id', restriction)
  if (params.years.length) {
    // `years` are parsed integers (see useFilters), never raw user text, so
    // it's safe to interpolate directly into a hand-built `.or()` expression.
    query = query.or(
      params.years.map((y) => `and(release_date.gte.${y}-01-01,release_date.lte.${y}-12-31)`).join(','),
    )
  }

  const from = params.page * params.pageSize
  const to = from + params.pageSize - 1
  const { data, error, count } = await query
    .order(column, { ascending, nullsFirst: false })
    .range(from, to)

  if (error) throw error
  return { rows: data ?? [], count: count ?? 0 }
}

export interface DashboardSummary {
  totalItems: number
  countsByType: Record<ItemType, number>
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data, error } = await supabase.from('all_items').select('item_type')
  if (error) throw error

  const countsByType = Object.fromEntries(ITEM_TYPES.map((type) => [type, 0])) as Record<
    ItemType,
    number
  >

  for (const row of data ?? []) {
    countsByType[row.item_type as ItemType] += 1
  }

  return {
    totalItems: (data ?? []).length,
    countsByType,
  }
}

export interface GenreSummaryRow {
  id: string
  name: string
  count: number
}

export async function fetchGenreSummary(): Promise<GenreSummaryRow[]> {
  const { data, error } = await supabase.from('game_genres').select('genre_id, genres(name)')
  if (error) throw error

  const counts = new Map<string, { name: string; count: number }>()
  for (const row of data ?? []) {
    const genre = row.genres as unknown as { name: string } | null
    if (!genre) continue
    const existing = counts.get(row.genre_id)
    if (existing) existing.count += 1
    else counts.set(row.genre_id, { name: genre.name, count: 1 })
  }

  return Array.from(counts.entries())
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)
}

export async function fetchRecentlyAdded(limit: number): Promise<AllItemRow[]> {
  const { data, error } = await supabase
    .from('all_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
