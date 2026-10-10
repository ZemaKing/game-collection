import { supabase } from '@/lib/supabaseClient'
import { FORMAT_TAG_SLUGS, ITEM_TYPES } from '@/features/items/constants'
import { SORT_KEYS, type SortKey } from '@/features/items/sort'
import { searchTokens, tokenPattern } from '@/features/search/searchQuery'
import { combineIdRestrictions, pageRange, releaseYearsExpression } from '@/features/items/listingQuery'
import type { AllItemRow, Genre, ItemCondition, ItemType, Platform } from '@/features/items/types'

/**
 * The `all_items` columns every listing-style row needs (cards, search results, related items,
 * duplicates). Two are PostgREST computed fields (ROADMAP Phase 39): `has_description` stands in
 * for the description text, which was most of each row's bytes and is only shown on the detail
 * page, and `format_slug` (the Digital / Physical badge) replaces a second, serial item_tags
 * request after every query.
 */
export const ALL_ITEM_COLUMNS =
  'id, item_type, title, subtitle, platform_id, release_date, collection_date, condition, cover_image_path, cover_thumb_path, cover_small_path, genre_slug, genre_name, edition_name, completed, parent_game_id, created_at, updated_at, has_description, format_slug'

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
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug')
    .in('slug', FORMAT_TAG_SLUGS)
    .order('name')
  if (error) throw error
  return data
}

/**
 * Distinct stored edition names present in the collection (games, special
 * editions, steelbooks), optionally limited to one item type so single-type
 * listings only offer editions that can match.
 */
export async function fetchAvailableEditions(itemType?: ItemType): Promise<string[]> {
  let query = supabase.from('all_items').select('edition_name').not('edition_name', 'is', null)
  if (itemType) query = query.eq('item_type', itemType)
  const { data, error } = await query
  if (error) throw error
  return Array.from(new Set((data ?? []).map((row) => row.edition_name as string).filter(Boolean)))
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

// Re-exported so existing importers keep working; the definitions live in `sort.ts`, which (unlike this file) has no Supabase dependency.
export { SORT_KEYS }
export type { SortKey }

const SORT_COLUMNS: Record<SortKey, { column: string; ascending: boolean }> = {
  recently_added: { column: 'created_at', ascending: false },
  title: { column: 'title', ascending: true },
  release_date: { column: 'release_date', ascending: false },
  last_updated: { column: 'updated_at', ascending: false },
}

export interface FetchItemsParams {
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
  page: number
  pageSize: number
}

export interface FetchItemsResult {
  rows: AllItemRow[]
  count: number
}

/**
 * A DLC has no genres of its own — it takes its base game's (see `all_items`) —
 * so a genre match on games must also match those games' DLCs.
 */
export async function fetchDlcIdsForGames(gameIds: string[]): Promise<string[]> {
  if (gameIds.length === 0) return []
  const { data, error } = await supabase.from('dlcs').select('id').in('game_id', gameIds)
  // Best effort: a failure here should only drop the DLC matches, not break the whole genre filter/search.
  if (error) return []
  return (data ?? []).map((row) => row.id)
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
    const gameIds = (data ?? []).map((r) => r.game_id)
    genreItemIds = new Set([...gameIds, ...(await fetchDlcIdsForGames(gameIds))])
  }

  let tagItemIds: Set<string> | null = null
  if (tagIds.length) {
    const { data, error } = await supabase.from('item_tags').select('item_id').in('tag_id', tagIds)
    if (error) throw error
    tagItemIds = new Set((data ?? []).map((r) => r.item_id))
  }

  return combineIdRestrictions(genreItemIds, tagItemIds)
}

export async function fetchItems(params: FetchItemsParams): Promise<FetchItemsResult> {
  const restriction = await resolveGenreTagRestriction(params.genreIds, params.tagIds)
  if (restriction && restriction.length === 0) return { rows: [], count: 0 }

  const { column, ascending } = SORT_COLUMNS[params.sort]
  let query = supabase.from('all_items').select(ALL_ITEM_COLUMNS, { count: 'exact' })

  // Every typed word must appear in the normalized title (see `searchTokens`).
  for (const token of searchTokens(params.search)) query = query.ilike('title_search', tokenPattern(token))
  if (params.itemTypes.length) query = query.in('item_type', params.itemTypes)
  if (params.platformIds.length) query = query.in('platform_id', params.platformIds)
  if (params.editions.length) query = query.in('edition_name', params.editions)
  if (params.conditions.length) query = query.in('condition', params.conditions)
  if (params.collectionDateFrom) query = query.gte('collection_date', params.collectionDateFrom)
  if (params.collectionDateTo) query = query.lte('collection_date', params.collectionDateTo)
  if (restriction) query = query.in('id', restriction)
  const years = releaseYearsExpression(params.years)
  if (years) query = query.or(years)

  const { from, to } = pageRange(params.page, params.pageSize)
  const { data, error, count } = await query
    .order(column, { ascending, nullsFirst: false })
    .range(from, to)

  if (error) throw error
  return { rows: data ?? [], count: count ?? 0 }
}

/** Supabase caps a single response at 1000 rows by default; aggregate queries must page through. */
const AGGREGATE_PAGE_SIZE = 1000

/**
 * Reads every row of an unbounded query by paging with `.range()`. `build`
 * must apply a stable `.order()` so pages never overlap or skip rows.
 */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: Error | null }>,
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += AGGREGATE_PAGE_SIZE) {
    const { data, error } = await build(from, from + AGGREGATE_PAGE_SIZE - 1)
    if (error) throw error
    const page = data ?? []
    all.push(...page)
    if (page.length < AGGREGATE_PAGE_SIZE) return all
  }
}

export interface DashboardSummary {
  totalItems: number
  countsByType: Record<ItemType, number>
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const data = await fetchAllRows((from, to) =>
    supabase.from('all_items').select('id, item_type').order('id').range(from, to),
  )

  const countsByType = Object.fromEntries(ITEM_TYPES.map((type) => [type, 0])) as Record<
    ItemType,
    number
  >

  for (const row of data) {
    countsByType[row.item_type as ItemType] += 1
  }

  return {
    totalItems: data.length,
    countsByType,
  }
}

export interface GenreSummaryRow {
  id: string
  name: string
  slug: string
  count: number
}

export async function fetchGenreSummary(): Promise<GenreSummaryRow[]> {
  const data = await fetchAllRows((from, to) =>
    supabase
      .from('game_genres')
      .select('game_id, genre_id, genres(name, slug)')
      .order('game_id')
      .order('genre_id')
      .range(from, to),
  )

  const counts = new Map<string, { name: string; slug: string; count: number }>()
  for (const row of data) {
    const genre = row.genres as unknown as { name: string; slug: string } | null
    if (!genre) continue
    const existing = counts.get(row.genre_id)
    if (existing) existing.count += 1
    else counts.set(row.genre_id, { name: genre.name, slug: genre.slug, count: 1 })
  }

  return Array.from(counts.entries())
    .map(([id, { name, slug, count }]) => ({ id, name, slug, count }))
    .sort((a, b) => b.count - a.count)
}

export async function fetchRecentlyAdded(limit: number): Promise<AllItemRow[]> {
  const { data, error } = await supabase
    .from('all_items')
    .select(ALL_ITEM_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
