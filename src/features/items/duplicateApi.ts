import { supabase } from '@/lib/supabaseClient'
import { duplicateLookup } from '@/features/items/duplicates'
import type { AllItemRow, ItemType } from '@/features/items/types'

const MATCH_LIMIT = 10

/** Items that are likely duplicates of a new one; the rule itself is `duplicateLookup`. */
export async function findLikelyDuplicates(
  itemType: ItemType,
  title: string,
  /** DLCs only: titles like "Season Pass" legitimately repeat across games, so match within the base game. */
  parentGameId?: string,
): Promise<AllItemRow[]> {
  const lookup = duplicateLookup(itemType, title, parentGameId)
  if (!lookup) return []

  let query = supabase
    .from('all_items')
    .select('*')
    .eq('item_type', lookup.itemType)
    .ilike('title', lookup.titlePattern)
  if (lookup.parentGameId) query = query.eq('parent_game_id', lookup.parentGameId)
  const { data, error } = await query.limit(MATCH_LIMIT)
  if (error) throw error
  return data ?? []
}
