import { supabase } from '@/lib/supabaseClient'
import { fetchAllRows, withFormats } from '@/features/items/api'
import type { AllItemRow } from '@/features/items/types'

/** A game offered in the DLC form's "Base Game" picker. */
export interface GameOption {
  id: string
  title: string
  platform_id: string | null
}

export async function fetchGameOptions(): Promise<GameOption[]> {
  return fetchAllRows<GameOption>((from, to) =>
    supabase
      .from('all_items')
      .select('id, title, platform_id')
      .eq('item_type', 'game')
      .order('title')
      .order('id')
      .range(from, to),
  )
}

/** Every DLC / expansion of one game, oldest release first (undated ones last). */
export async function fetchDlcsForGame(gameId: string): Promise<AllItemRow[]> {
  const { data, error } = await supabase
    .from('all_items')
    .select('*')
    .eq('item_type', 'dlc')
    .eq('parent_game_id', gameId)
    .order('release_date', { ascending: true, nullsFirst: false })
    .order('title')
  if (error) throw error
  return withFormats(data ?? [])
}

/** The `all_items` row of a single item (a DLC's base game), or null if it no longer exists. */
export async function fetchItemRow(id: string): Promise<AllItemRow | null> {
  const { data, error } = await supabase.from('all_items').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return (await withFormats([data]))[0]
}
