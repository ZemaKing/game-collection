import { ITEM_TABLE_NAMES } from '@/features/items/constants'
import { ITEM_IMAGES_BUCKET } from '@/features/items/storage'
import type { ItemType } from '@/features/items/types'
import { supabase } from '@/lib/supabaseClient'

/**
 * Deletes an item plus every dependent row/object that isn't covered by a DB
 * FK cascade. `item_images`, `item_relationships`, and `item_tags` are all
 * polymorphic (item_type + item_id, not a real FK — see Phase 4/17 notes), so
 * nothing cleans them up automatically; `game_genres` *is* FK'd to `games`
 * with `on delete cascade`, so it needs no explicit handling here.
 * Storage objects and dependent rows are removed before the item row itself,
 * so a failure partway through never leaves the item row as the only
 * survivor with orphaned children still pointing at it.
 */
export async function deleteItem(itemType: ItemType, itemId: string): Promise<void> {
  // A DLC can't outlive its game (`dlcs.game_id ... on delete cascade`), but the cascade can't remove the
  // DLCs' storage objects, so delete them first through the normal path.
  if (itemType === 'game') {
    const { data: dlcs, error: dlcsError } = await supabase.from('dlcs').select('id').eq('game_id', itemId)
    if (dlcsError) throw dlcsError
    for (const dlc of dlcs ?? []) await deleteItem('dlc', dlc.id)
  }

  const { data: images, error: imagesFetchError } = await supabase
    .from('item_images')
    .select('storage_path')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
  if (imagesFetchError) throw imagesFetchError

  if (images && images.length > 0) {
    const { error: removeStorageError } = await supabase.storage
      .from(ITEM_IMAGES_BUCKET)
      .remove(images.map((image) => image.storage_path))
    if (removeStorageError) throw removeStorageError
  }

  const { error: deleteImagesError } = await supabase
    .from('item_images')
    .delete()
    .eq('item_type', itemType)
    .eq('item_id', itemId)
  if (deleteImagesError) throw deleteImagesError

  const { error: deleteRelError } = await supabase
    .from('item_relationships')
    .delete()
    .or(
      `and(parent_type.eq.${itemType},parent_id.eq.${itemId}),and(child_type.eq.${itemType},child_id.eq.${itemId})`,
    )
  if (deleteRelError) throw deleteRelError

  const { error: deleteTagsError } = await supabase
    .from('item_tags')
    .delete()
    .eq('item_type', itemType)
    .eq('item_id', itemId)
  if (deleteTagsError) throw deleteTagsError

  const table = ITEM_TABLE_NAMES[itemType]
  const { error: deleteItemError } = await supabase.from(table).delete().eq('id', itemId)
  if (deleteItemError) throw deleteItemError
}
