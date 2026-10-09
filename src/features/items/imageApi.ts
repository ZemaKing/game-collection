import { fetchItemImages, ITEM_IMAGE_COLUMNS } from '@/features/items/detailApi'
import { imageObjectPaths, ITEM_IMAGES_BUCKET } from '@/features/items/storage'
import type { ItemImageRow } from '@/features/items/detailTypes'
import { IMAGE_CACHE_SECONDS, IMAGE_VARIANTS } from '@/features/items/imageVariants'
import type { ItemType } from '@/features/items/types'
import { resizeImageVariants } from '@/lib/image-resize'
import { supabase } from '@/lib/supabaseClient'

/**
 * Accepted *input* types and size. Every upload is converted in the browser, so
 * only WebP (PNG where a browser can't encode WebP) is stored; a GIF keeps its
 * first frame.
 */
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_IMAGES_PER_ITEM = 20

export interface FileValidationError {
  code: 'invalidType' | 'tooLarge' | 'maxCount'
  fileName: string
}

export interface FileValidationResult {
  valid: File[]
  errors: FileValidationError[]
}

/** Client-side mirror of the `item-images` bucket's server-side limits, so rejects are instant. */
export function validateFiles(files: File[], existingCount: number): FileValidationResult {
  const valid: File[] = []
  const errors: FileValidationError[] = []
  let count = existingCount

  for (const file of files) {
    if (count >= MAX_IMAGES_PER_ITEM) {
      errors.push({ code: 'maxCount', fileName: file.name })
      continue
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      errors.push({ code: 'invalidType', fileName: file.name })
      continue
    }
    if (file.size > MAX_IMAGE_BYTES) {
      errors.push({ code: 'tooLarge', fileName: file.name })
      continue
    }
    valid.push(file)
    count += 1
  }

  return { valid, errors }
}

async function removeStorageObjects(storagePaths: string[]): Promise<void> {
  await supabase.storage.from(ITEM_IMAGES_BUCKET).remove(storagePaths)
}

/** What a file becomes once stored: the `item_images` columns of its two variants. */
interface StoredVariants {
  storage_path: string
  thumb_path: string
  width: number
  height: number
}

/** Per-file progress for the upload queue: converting in the browser, then sending to Storage. */
export type UploadStage = 'optimizing' | 'uploading'

/**
 * Converts `file` to the full + thumb variants (`IMAGE_VARIANTS`) in the
 * browser and uploads both as `{itemType}/{itemId}/{uuid}.webp` and
 * `{uuid}.thumb.webp` (`.png` where a browser can't encode WebP), cached for a
 * year. If an upload fails, whatever was already uploaded is removed again.
 */
async function storeVariants(
  itemType: ItemType,
  itemId: string,
  file: File,
  onStage?: (stage: UploadStage) => void,
): Promise<StoredVariants> {
  onStage?.('optimizing')
  const [full, thumb] = await resizeImageVariants(file, [
    { name: 'full', ...IMAGE_VARIANTS.full, quality: IMAGE_VARIANTS.full.quality / 100 },
    { name: 'thumb', ...IMAGE_VARIANTS.thumb, quality: IMAGE_VARIANTS.thumb.quality / 100 },
  ])

  const base = `${itemType}/${itemId}/${crypto.randomUUID()}`
  const stored: StoredVariants = {
    storage_path: `${base}.${full.ext}`,
    thumb_path: `${base}.thumb.${thumb.ext}`,
    width: full.width,
    height: full.height,
  }

  onStage?.('uploading')
  const uploaded: string[] = []
  try {
    for (const [path, image] of [
      [stored.storage_path, full],
      [stored.thumb_path, thumb],
    ] as const) {
      const { error } = await supabase.storage
        .from(ITEM_IMAGES_BUCKET)
        .upload(path, image.blob, { contentType: image.type, cacheControl: IMAGE_CACHE_SECONDS })
      if (error) throw error
      uploaded.push(path)
    }
  } catch (err) {
    if (uploaded.length > 0) await removeStorageObjects(uploaded)
    throw err
  }
  return stored
}

export async function uploadItemImage(
  itemType: ItemType,
  itemId: string,
  file: File,
  position: number,
  isCover: boolean,
  onStage?: (stage: UploadStage) => void,
): Promise<ItemImageRow> {
  const stored = await storeVariants(itemType, itemId, file, onStage)

  const { data, error: insertError } = await supabase
    .from('item_images')
    .insert({ item_type: itemType, item_id: itemId, ...stored, position, is_cover: isCover })
    .select(ITEM_IMAGE_COLUMNS)
    .single()

  if (insertError) {
    await removeStorageObjects([stored.storage_path, stored.thumb_path])
    throw insertError
  }

  return data
}

/** `remainingImages` must be every other image still on this item (used to pick a cover fallback). */
export async function deleteItemImage(image: ItemImageRow, remainingImages: ItemImageRow[]): Promise<void> {
  const { error: removeError } = await supabase.storage.from(ITEM_IMAGES_BUCKET).remove(imageObjectPaths(image))
  if (removeError) throw removeError

  const { error: deleteError } = await supabase.from('item_images').delete().eq('id', image.id)
  if (deleteError) throw deleteError

  if (image.is_cover && remainingImages.length > 0) {
    const nextCover = [...remainingImages].sort((a, b) => a.position - b.position)[0]
    const { error: coverError } = await supabase
      .from('item_images')
      .update({ is_cover: true })
      .eq('id', nextCover.id)
    if (coverError) throw coverError
  }
}

export async function replaceItemImageFile(image: ItemImageRow, file: File): Promise<ItemImageRow> {
  const [itemType, itemId] = image.storage_path.split('/') as [ItemType, string]
  const stored = await storeVariants(itemType, itemId, file)

  const { data, error: updateError } = await supabase
    .from('item_images')
    // original_path belonged to the old photo, which is removed below.
    .update({ ...stored, original_path: null })
    .eq('id', image.id)
    .select(ITEM_IMAGE_COLUMNS)
    .single()

  if (updateError) {
    await removeStorageObjects([stored.storage_path, stored.thumb_path])
    throw updateError
  }

  await removeStorageObjects(imageObjectPaths(image))
  return data
}

/**
 * Appends one image (e.g. imported cover artwork) the same way
 * `useItemImages.addFiles` does for the first manually-picked file: cover
 * only if the item has no images yet, positioned after whatever's there.
 */
export async function appendItemCoverImage(itemType: ItemType, itemId: string, file: File): Promise<ItemImageRow> {
  // Converted like a picked file, so an imported RAWG cover is stored as WebP too.
  const existing = await fetchItemImages(itemType, itemId)
  return uploadItemImage(itemType, itemId, file, existing.length, existing.length === 0)
}

export async function reorderItemImages(orderedIds: string[]): Promise<void> {
  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase.from('item_images').update({ position: index }).eq('id', orderedIds[index])
    if (error) throw error
  }
}

export async function setCoverImage(itemType: ItemType, itemId: string, imageId: string): Promise<void> {
  const { error: unsetError } = await supabase
    .from('item_images')
    .update({ is_cover: false })
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .eq('is_cover', true)
  if (unsetError) throw unsetError

  const { error: setError } = await supabase.from('item_images').update({ is_cover: true }).eq('id', imageId)
  if (setError) throw setError
}

export async function updateImageAltText(imageId: string, altText: string): Promise<void> {
  const { error } = await supabase
    .from('item_images')
    .update({ alt_text: altText.trim() === '' ? null : altText.trim() })
    .eq('id', imageId)
  if (error) throw error
}
