import { supabase } from '@/lib/supabaseClient'
import { fetchDlcIdsForGames } from '@/features/items/api'
import { FORMAT_TAG_SLUGS } from '@/features/items/constants'
import type { AllItemRow } from '@/features/items/types'

const RESULT_LIMIT = 30

/**
 * Normalized search over title, subtitle (covers edition name / developer /
 * publisher / manufacturer / category depending on item type — see the
 * `all_items` view), platform name, genre name, and tag name.
 *
 * Implemented as several small, parameterized queries merged client-side
 * rather than one hand-built PostgREST `.or()` string, so user input never
 * has to be escaped for filter-string syntax (commas/parens/quotes).
 */
export async function searchItems(query: string): Promise<AllItemRow[]> {
  const q = query.trim()
  if (!q) return []
  const pattern = `%${q}%`

  const [titleMatches, subtitleMatches, platformMatches, genreMatches, tagMatches] =
    await Promise.all([
      supabase.from('all_items').select('*').ilike('title', pattern).limit(RESULT_LIMIT),
      supabase.from('all_items').select('*').ilike('subtitle', pattern).limit(RESULT_LIMIT),
      searchByPlatformName(pattern),
      searchByGenreName(pattern),
      searchByTagName(pattern),
    ])

  const merged = new Map<string, AllItemRow>()
  for (const result of [titleMatches, subtitleMatches, platformMatches, genreMatches, tagMatches]) {
    if (result.error) throw result.error
    for (const row of result.data ?? []) {
      if (!merged.has(row.id)) merged.set(row.id, row)
    }
  }

  return Array.from(merged.values()).slice(0, RESULT_LIMIT)
}

async function searchByPlatformName(pattern: string) {
  const { data: platforms, error } = await supabase.from('platforms').select('id').ilike('name', pattern)
  if (error || !platforms?.length) return { data: [], error }
  return supabase
    .from('all_items')
    .select('*')
    .in(
      'platform_id',
      platforms.map((p) => p.id),
    )
    .limit(RESULT_LIMIT)
}

async function searchByGenreName(pattern: string) {
  const { data: genres, error: genresError } = await supabase
    .from('genres')
    .select('id')
    .ilike('name', pattern)
  if (genresError || !genres?.length) return { data: [], error: genresError }

  const { data: gameGenres, error: gameGenresError } = await supabase
    .from('game_genres')
    .select('game_id')
    .in(
      'genre_id',
      genres.map((g) => g.id),
    )
  if (gameGenresError || !gameGenres?.length) return { data: [], error: gameGenresError }

  const gameIds = gameGenres.map((g) => g.game_id)
  return supabase
    .from('all_items')
    .select('*')
    .in('id', [...gameIds, ...(await fetchDlcIdsForGames(gameIds))])
    .limit(RESULT_LIMIT)
}

async function searchByTagName(pattern: string) {
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('id')
    .in('slug', FORMAT_TAG_SLUGS)
    .ilike('name', pattern)
  if (tagsError || !tags?.length) return { data: [], error: tagsError }

  const { data: itemTags, error: itemTagsError } = await supabase
    .from('item_tags')
    .select('item_id')
    .in(
      'tag_id',
      tags.map((t) => t.id),
    )
  if (itemTagsError || !itemTags?.length) return { data: [], error: itemTagsError }

  return supabase
    .from('all_items')
    .select('*')
    .in(
      'id',
      itemTags.map((t) => t.item_id),
    )
    .limit(RESULT_LIMIT)
}
