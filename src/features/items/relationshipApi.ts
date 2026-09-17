import { supabase } from '@/lib/supabaseClient'
import type { AllItemRow, ItemType } from '@/features/items/types'

export interface RelatedItemRow extends AllItemRow {
  relationshipType: string
}

export interface ItemRelationships {
  /** Items this item belongs to / is contained by (e.g. a steelbook's parent special edition). */
  parents: RelatedItemRow[]
  /** Items this item contains / owns (e.g. a special edition's steelbook, artbook, figure). */
  children: RelatedItemRow[]
}

const EMPTY_RELATIONSHIPS: ItemRelationships = { parents: [], children: [] }

interface RelationshipRef {
  type: ItemType
  id: string
  relationshipType: string
}

/**
 * Only fetches direct (one-hop) relationships in each direction — never a
 * recursive graph walk — so this can't infinite-loop even if a future
 * multi-hop cycle existed. Direct self-reference and duplicate links are
 * already rejected at the database level (see item_relationships_* checks
 * in supabase/migrations); a full graph-cycle guard only matters once the
 * link/unlink write UI exists (Phase 16-18).
 */
export async function fetchItemRelationships(
  itemType: ItemType,
  id: string,
): Promise<ItemRelationships> {
  const [asParent, asChild] = await Promise.all([
    supabase
      .from('item_relationships')
      .select('child_type, child_id, relationship_type')
      .eq('parent_type', itemType)
      .eq('parent_id', id),
    supabase
      .from('item_relationships')
      .select('parent_type, parent_id, relationship_type')
      .eq('child_type', itemType)
      .eq('child_id', id),
  ])
  if (asParent.error) throw asParent.error
  if (asChild.error) throw asChild.error

  const childRefs: RelationshipRef[] = (asParent.data ?? []).map((r) => ({
    type: r.child_type,
    id: r.child_id,
    relationshipType: r.relationship_type,
  }))
  const parentRefs: RelationshipRef[] = (asChild.data ?? []).map((r) => ({
    type: r.parent_type,
    id: r.parent_id,
    relationshipType: r.relationship_type,
  }))

  const allIds = [...childRefs, ...parentRefs].map((r) => r.id)
  if (allIds.length === 0) return EMPTY_RELATIONSHIPS

  const { data: items, error } = await supabase.from('all_items').select('*').in('id', allIds)
  if (error) throw error
  const byId = new Map((items ?? []).map((item) => [item.id, item]))

  function resolve(refs: RelationshipRef[]): RelatedItemRow[] {
    const rows: RelatedItemRow[] = []
    for (const ref of refs) {
      const item = byId.get(ref.id)
      // The relationship row may point at an item that no longer exists
      // (shouldn't happen — item tables cascade-delete their relationship
      // rows — but skip gracefully rather than render a broken card).
      if (item) rows.push({ ...item, relationshipType: ref.relationshipType })
    }
    return rows
  }

  return { parents: resolve(parentRefs), children: resolve(childRefs) }
}
