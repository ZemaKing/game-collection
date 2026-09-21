import { useState } from 'react'
import { ITEM_TABLE_NAMES } from '@/features/items/constants'
import type { ItemType } from '@/features/items/types'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { classifySupabaseError, type ErrorKind } from '@/lib/errorHelpers'
import { supabase } from '@/lib/supabaseClient'

export interface RelatedItemRef {
  itemType: ItemType
  itemId: string
}

const COMMON_KEYS = ['title', 'release_date', 'collection_date', 'condition', 'description']

/** Extra columns per table, beyond the common fields every item table shares (see Phase 4 migrations). */
const TYPE_KEYS: Record<ItemType, string[]> = {
  game: ['platform_id', 'edition_name', 'developer', 'publisher', 'completed'],
  special_edition: ['platform_id', 'edition_name'],
  steelbook: ['platform_id'],
  artbook: ['publisher', 'page_count', 'isbn', 'language'],
  figure: ['manufacturer', 'character_name', 'scale', 'material', 'height_cm'],
  stuff: ['category', 'manufacturer'],
  dlc: ['game_id', 'dlc_type', 'completed'],
}

function buildPayload(itemType: ItemType, values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const key of [...COMMON_KEYS, ...TYPE_KEYS[itemType]]) {
    const value = values[key]
    payload[key] = value === undefined ? null : value
  }
  return payload
}

/**
 * Create/update one item row plus its polymorphic child rows, following the
 * replace-all strategy `recipe-collection/src/hooks/useSaveRecipe.ts` uses
 * for its own child tables — simple and safe for a single-owner app.
 *
 * `relatedItemIds` only ever writes *outgoing* (parent-side) links from the
 * item being edited; the read side (`RelatedItemsSection`) already walks
 * both directions, so a link made from either item's form becomes visible
 * from both.
 *
 * `baseGameIds` is the one exception: a special edition's form can also
 * write *incoming* links (game → this edition) so its "Base Game" section is
 * settable from the edition itself. Pass `undefined` to leave incoming links
 * untouched; otherwise only game-parented incoming links are replaced, so
 * links from other item types are never dropped.
 */
export function useSaveItem(itemType: ItemType) {
  const isOnline = useOnlineStatus()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null)

  async function save(
    itemId: string | null,
    values: Record<string, unknown> & { tagIds?: string[]; genreIds?: string[] },
    relatedItemIds: RelatedItemRef[],
    baseGameIds?: RelatedItemRef[],
  ): Promise<string> {
    setIsSaving(true)
    setError(null)
    setErrorKind(null)
    try {
      const table = ITEM_TABLE_NAMES[itemType]
      const payload = buildPayload(itemType, values)

      let id = itemId
      if (id) {
        const { error: updateError } = await supabase.from(table).update(payload).eq('id', id)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase.from(table).insert(payload).select('id').single()
        if (insertError) throw insertError
        id = data.id as string
      }

      const tagIds = values.tagIds ?? []
      const { error: deleteTagsError } = await supabase
        .from('item_tags')
        .delete()
        .eq('item_type', itemType)
        .eq('item_id', id)
      if (deleteTagsError) throw deleteTagsError
      if (tagIds.length > 0) {
        const { error: insertTagsError } = await supabase
          .from('item_tags')
          .insert(tagIds.map((tagId) => ({ item_type: itemType, item_id: id, tag_id: tagId })))
        if (insertTagsError) throw insertTagsError
      }

      if (itemType === 'game') {
        const genreIds = values.genreIds ?? []
        const { error: deleteGenresError } = await supabase.from('game_genres').delete().eq('game_id', id)
        if (deleteGenresError) throw deleteGenresError
        if (genreIds.length > 0) {
          const { error: insertGenresError } = await supabase
            .from('game_genres')
            .insert(genreIds.map((genreId, position) => ({ game_id: id, genre_id: genreId, position })))
          if (insertGenresError) throw insertGenresError
        }
      }

      const { error: deleteRelError } = await supabase
        .from('item_relationships')
        .delete()
        .eq('parent_type', itemType)
        .eq('parent_id', id)
      if (deleteRelError) throw deleteRelError
      if (relatedItemIds.length > 0) {
        const { error: insertRelError } = await supabase.from('item_relationships').insert(
          relatedItemIds.map((ref) => ({
            parent_type: itemType,
            parent_id: id,
            child_type: ref.itemType,
            child_id: ref.itemId,
            relationship_type: 'related',
          })),
        )
        if (insertRelError) throw insertRelError
      }

      if (baseGameIds) {
        const { error: deleteBaseError } = await supabase
          .from('item_relationships')
          .delete()
          .eq('child_type', itemType)
          .eq('child_id', id)
          .eq('parent_type', 'game')
        if (deleteBaseError) throw deleteBaseError
        if (baseGameIds.length > 0) {
          const { error: insertBaseError } = await supabase.from('item_relationships').insert(
            baseGameIds.map((ref) => ({
              parent_type: ref.itemType,
              parent_id: ref.itemId,
              child_type: itemType,
              child_id: id,
              relationship_type: 'related',
            })),
          )
          if (insertBaseError) throw insertBaseError
        }
      }

      return id as string
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setErrorKind(classifySupabaseError(err, isOnline))
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { save, isSaving, error, errorKind }
}
