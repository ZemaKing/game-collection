import { supabase } from '@/lib/supabaseClient'
import type { AllItemRow, ItemType } from '@/features/items/types'

const MATCH_LIMIT = 10

/**
 * "Likely duplicate" = same item type + same title, case/whitespace
 * insensitive (`ilike` with no wildcards is an exact case-insensitive
 * match). Deliberately title-only, no platform/publisher narrowing —
 * confirmed with the owner during planning as the simplest rule that still
 * catches the common case (re-adding an item already in the collection).
 */
export async function findLikelyDuplicates(itemType: ItemType, title: string): Promise<AllItemRow[]> {
  const normalized = title.trim()
  if (!normalized) return []

  const { data, error } = await supabase
    .from('all_items')
    .select('*')
    .eq('item_type', itemType)
    .ilike('title', normalized)
    .limit(MATCH_LIMIT)
  if (error) throw error
  return data ?? []
}
