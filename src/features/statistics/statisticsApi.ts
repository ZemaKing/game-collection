import { fetchAllRows, fetchGenreSummary, fetchPlatforms, type GenreSummaryRow } from '@/features/items/api'
import type { Platform } from '@/features/items/types'
import type { StatsRow } from '@/features/statistics/statistics'
import { supabase } from '@/lib/supabaseClient'

export interface StatisticsData {
  rows: StatsRow[]
  platforms: Platform[]
  genres: GenreSummaryRow[]
}

/**
 * One lightweight pass over `all_items` feeds every breakdown (and the
 * completeness calculation), so the numbers can't disagree with each other.
 * Genres come from the same query the dashboard uses.
 */
export async function fetchStatisticsData(): Promise<StatisticsData> {
  const [rows, platforms, genres] = await Promise.all([
    fetchAllRows<StatsRow>((from, to) =>
      supabase
        .from('all_items')
        .select(
          'id, item_type, subtitle, platform_id, release_date, collection_date, condition, description, cover_image_path, created_at',
        )
        .order('id')
        .range(from, to),
    ),
    fetchPlatforms(),
    fetchGenreSummary(),
  ])
  return { rows, platforms, genres }
}
