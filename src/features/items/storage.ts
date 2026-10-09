import { supabase } from '@/lib/supabaseClient'

export const ITEM_IMAGES_BUCKET = 'item-images'

/**
 * Plain public URLs rather than Supabase's image-transform query params
 * (`?width=&height=`): transforms need a paid add-on that may not be
 * enabled on every project, and would silently break covers/gallery if not.
 * Smaller downloads come from the stored WebP variants instead (see
 * `getImageUrls`); CSS (aspect-ratio + object-fit) does the rest.
 */
export function getImagePublicUrl(storagePath: string): string {
  return supabase.storage.from(ITEM_IMAGES_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

/** Where an image's variants live: `storage_path` is the full image, `thumb_path` its small WebP. */
export interface ImagePaths {
  storage_path: string
  thumb_path?: string | null
}

export type ImageVariant = 'thumb' | 'full'

/** The Storage path to load for a variant. A thumb falls back to the full image until the row has one. */
export function imagePathFor(paths: ImagePaths, variant: ImageVariant): string {
  return variant === 'thumb' ? (paths.thumb_path ?? paths.storage_path) : paths.storage_path
}

/** Public URLs of both variants: `thumb` for cards, strips and lists, `full` for the detail image and viewer. */
export function getImageUrls(paths: ImagePaths): { full: string; thumb: string } {
  return {
    full: getImagePublicUrl(imagePathFor(paths, 'full')),
    thumb: getImagePublicUrl(imagePathFor(paths, 'thumb')),
  }
}

/** Every Storage object an image row owns (full, thumb, pre-WebP original), for deletes. */
export function imageObjectPaths(row: ImagePaths & { original_path?: string | null }): string[] {
  return [...new Set([row.storage_path, row.thumb_path, row.original_path].filter((p): p is string => !!p))]
}
