import { ITEM_IMAGES_BUCKET } from '@/features/items/storage'
import type { ItemImageRow } from '@/features/items/detailTypes'
import type { ItemType } from '@/features/items/types'
import { supabase } from '@/lib/supabaseClient'

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

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  return file.type.split('/').pop() ?? 'jpg'
}

async function removeStorageObject(storagePath: string): Promise<void> {
  await supabase.storage.from(ITEM_IMAGES_BUCKET).remove([storagePath])
}

export async function uploadItemImage(
  itemType: ItemType,
  itemId: string,
  file: File,
  position: number,
  isCover: boolean,
): Promise<ItemImageRow> {
  const storagePath = `${itemType}/${itemId}/${crypto.randomUUID()}.${extensionFor(file)}`

  const { error: uploadError } = await supabase.storage.from(ITEM_IMAGES_BUCKET).upload(storagePath, file, {
    contentType: file.type,
  })
  if (uploadError) throw uploadError

  const { data, error: insertError } = await supabase
    .from('item_images')
    .insert({ item_type: itemType, item_id: itemId, storage_path: storagePath, position, is_cover: isCover })
    .select('id, storage_path, position, is_cover, alt_text')
    .single()

  if (insertError) {
    await removeStorageObject(storagePath)
    throw insertError
  }

  return data
}

/** `remainingImages` must be every other image still on this item (used to pick a cover fallback). */
export async function deleteItemImage(image: ItemImageRow, remainingImages: ItemImageRow[]): Promise<void> {
  const { error: removeError } = await supabase.storage.from(ITEM_IMAGES_BUCKET).remove([image.storage_path])
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
  const itemTypeAndId = image.storage_path.split('/').slice(0, 2)
  const newStoragePath = `${itemTypeAndId[0]}/${itemTypeAndId[1]}/${crypto.randomUUID()}.${extensionFor(file)}`

  const { error: uploadError } = await supabase.storage.from(ITEM_IMAGES_BUCKET).upload(newStoragePath, file, {
    contentType: file.type,
  })
  if (uploadError) throw uploadError

  const { data, error: updateError } = await supabase
    .from('item_images')
    .update({ storage_path: newStoragePath })
    .eq('id', image.id)
    .select('id, storage_path, position, is_cover, alt_text')
    .single()

  if (updateError) {
    await removeStorageObject(newStoragePath)
    throw updateError
  }

  await removeStorageObject(image.storage_path)
  return data
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
