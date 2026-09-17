import { supabase } from '@/lib/supabaseClient'

export const ITEM_IMAGES_BUCKET = 'item-images'

/**
 * Plain public URLs rather than Supabase's image-transform query params
 * (`?width=&height=`): transforms need a paid add-on that may not be
 * enabled on every project, and would silently break covers/gallery if not.
 * "Responsive" here comes from CSS (aspect-ratio + object-fit: cover), not
 * server-resized variants.
 */
export function getImagePublicUrl(storagePath: string): string {
  return supabase.storage.from(ITEM_IMAGES_BUCKET).getPublicUrl(storagePath).data.publicUrl
}
