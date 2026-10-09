import { supabase } from '@/lib/supabaseClient'
import { ALL_ITEM_COLUMNS, fetchDlcIdsForGames } from '@/features/items/api'
import { FORMAT_TAG_SLUGS } from '@/features/items/constants'
import { escapeLikePattern } from '@/features/items/likePattern'
import { mergeSearchResults, searchTokens, tokenPattern } from '@/features/search/searchQuery'
import type { AllItemRow } from '@/features/items/types'

const RESULT_LIMIT = 30

/**
 * Search over title, subtitle (covers edition name / developer / publisher /
 * manufacturer / category depending on item type — see the `all_items` view),
 * platform name, genre name, and tag name.
 *
 * Title and subtitle use the forgiving token match (`searchTokens`: every
 * typed word must appear in the normalized text, ignoring punctuation, with
 * Roman/Arabic numerals and acronyms interchangeable); platform, genre and tag
 * names use a plain substring match of the whole query.
 *
 * Implemented as several small, parameterized queries merged client-side
 * rather than one hand-built PostgREST `.or()` string, so user input never
 * has to be escaped for filter-string syntax (commas/parens/quotes).
 */
export async function searchItems(query: string): Promise<AllItemRow[]> {
  const q = query.trim()
  if (!q) return []
  const pattern = `%${escapeLikePattern(q)}%`
  const tokens = searchTokens(q)

  const [titleMatches, subtitleMatches, platformMatches, genreMatches, tagMatches] =
    await Promise.all([
      searchByTokens('title_search', tokens),
      searchByTokens('subtitle_search', tokens),
      searchByPlatformName(pattern),
      searchByGenreName(pattern),
      searchByTagName(pattern),
    ])

  const results = [titleMatches, subtitleMatches, platformMatches, genreMatches, tagMatches]
  for (const result of results) if (result.error) throw result.error
  return mergeSearchResults(
    results.map((result) => result.data ?? []),
    RESULT_LIMIT,
  )
}

async function searchByTokens(column: 'title_search' | 'subtitle_search', tokens: string[]) {
  // A query of only punctuation has no tokens; match nothing rather than everything.
  if (!tokens.length) return { data: [], error: null }
  let query = supabase.from('all_items').select(ALL_ITEM_COLUMNS)
  for (const token of tokens) query = query.ilike(column, tokenPattern(token))
  return query.limit(RESULT_LIMIT)
}

async function searchByPlatformName(pattern: string) {
  const { data: platforms, error } = await supabase.from('platforms').select('id').ilike('name', pattern)
  if (error || !platforms?.length) return { data: [], error }
  return supabase
    .from('all_items')
    .select(ALL_ITEM_COLUMNS)
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
    .select(ALL_ITEM_COLUMNS)
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
    .select(ALL_ITEM_COLUMNS)
    .in(
      'id',
      itemTags.map((t) => t.item_id),
    )
    .limit(RESULT_LIMIT)
}
