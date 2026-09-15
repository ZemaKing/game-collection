import { supabase } from '@/lib/supabaseClient'
import { ITEM_TYPES } from '@/features/items/constants'
import type { AllItemRow, ItemType, Platform } from '@/features/items/types'

export async function fetchPlatforms(): Promise<Platform[]> {
  const { data, error } = await supabase.from('platforms').select('id, name, slug').order('name')
  if (error) throw error
  return data
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
  itemType: ItemType | 'all'
  platformId: string | 'all'
  sort: SortKey
  page: number
  pageSize: number
}

export interface FetchItemsResult {
  rows: AllItemRow[]
  count: number
}

export async function fetchItems({
  itemType,
  platformId,
  sort,
  page,
  pageSize,
}: FetchItemsParams): Promise<FetchItemsResult> {
  const { column, ascending } = SORT_COLUMNS[sort]
  let query = supabase.from('all_items').select('*', { count: 'exact' })
  if (itemType !== 'all') query = query.eq('item_type', itemType)
  if (platformId !== 'all') query = query.eq('platform_id', platformId)

  const from = page * pageSize
  const to = from + pageSize - 1
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
