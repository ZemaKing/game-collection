import { useEffect, useState } from 'react'
import { fetchItemImages } from '@/features/items/detailApi'
import type { ItemImageRow } from '@/features/items/detailTypes'
import {
  deleteItemImage,
  replaceItemImageFile,
  reorderItemImages,
  setCoverImage,
  updateImageAltText,
  uploadItemImage,
  validateFiles,
  type FileValidationError,
} from '@/features/items/imageApi'
import type { ItemType } from '@/features/items/types'

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error'

export interface UploadQueueItem {
  id: string
  name: string
  status: UploadStatus
  errorMessage?: string
}

/**
 * Owns the full read/write lifecycle for one item's gallery: initial load,
 * an upload queue with per-file status (no byte-level progress — see
 * imageApi.ts / DEVELOPMENT_PLAN.md Phase 17 for why), and every mutation
 * (delete/replace/reorder/cover/alt-text), each saving immediately rather
 * than being staged behind the item form's own Save button.
 */
export function useItemImages(itemType: ItemType, itemId: string) {
  const [images, setImages] = useState<ItemImageRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([])
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [busyImageId, setBusyImageId] = useState<string | null>(null)

  // Reset to "loading" during render when the target item changes, rather
  // than in the effect body (see useItemDetail.ts for the same pattern).
  const requestKey = `${itemType}|${itemId}`
  const [lastRequestKey, setLastRequestKey] = useState(requestKey)
  if (requestKey !== lastRequestKey) {
    setLastRequestKey(requestKey)
    setIsLoading(true)
  }

  useEffect(() => {
    let cancelled = false
    fetchItemImages(itemType, itemId)
      .then((rows) => {
        if (!cancelled) setImages(rows)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [itemType, itemId])

  function updateQueueItem(id: string, patch: Partial<UploadQueueItem>) {
    setUploadQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  async function addFiles(files: File[]) {
    setError(null)
    setValidationErrors([])
    const { valid, errors } = validateFiles(files, images.length)
    if (errors.length > 0) setValidationErrors(errors)

    const queueEntries: UploadQueueItem[] = valid.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      status: 'queued',
    }))
    setUploadQueue((prev) => [...prev, ...queueEntries])

    for (let i = 0; i < valid.length; i += 1) {
      const file = valid[i]
      const queueId = queueEntries[i].id
      updateQueueItem(queueId, { status: 'uploading' })
      try {
        const position = images.length + i
        const isCover = images.length === 0 && i === 0
        const row = await uploadItemImage(itemType, itemId, file, position, isCover)
        setImages((prev) => [...prev, row])
        updateQueueItem(queueId, { status: 'done' })
      } catch (err) {
        updateQueueItem(queueId, { status: 'error', errorMessage: (err as Error).message })
      }
    }
  }

  function dismissQueueItem(id: string) {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id))
  }

  async function removeImage(image: ItemImageRow) {
    setError(null)
    setBusyImageId(image.id)
    try {
      const remaining = images.filter((img) => img.id !== image.id)
      await deleteItemImage(image, remaining)
      const stillCover = remaining.some((img) => img.is_cover)
      const nextCover = !stillCover && remaining.length > 0 ? [...remaining].sort((a, b) => a.position - b.position)[0].id : null
      setImages(
        remaining.map((img) => (nextCover && img.id === nextCover ? { ...img, is_cover: true } : img)),
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyImageId(null)
    }
  }

  async function replaceImage(image: ItemImageRow, file: File) {
    setError(null)
    setValidationErrors([])
    const validation = validateFiles([file], images.length - 1)
    if (validation.errors.length > 0) {
      setValidationErrors(validation.errors)
      return
    }
    setBusyImageId(image.id)
    try {
      const updated = await replaceItemImageFile(image, file)
      setImages((prev) => prev.map((img) => (img.id === image.id ? updated : img)))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyImageId(null)
    }
  }

  async function moveImage(image: ItemImageRow, direction: -1 | 1) {
    const sorted = [...images].sort((a, b) => a.position - b.position)
    const index = sorted.findIndex((img) => img.id === image.id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sorted.length) return

    const reordered = [...sorted]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    const orderedIds = reordered.map((img) => img.id)

    setImages(reordered.map((img, i) => ({ ...img, position: i })))
    setError(null)
    try {
      await reorderItemImages(orderedIds)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function makeCover(image: ItemImageRow) {
    if (image.is_cover) return
    setError(null)
    setBusyImageId(image.id)
    try {
      await setCoverImage(itemType, itemId, image.id)
      setImages((prev) => prev.map((img) => ({ ...img, is_cover: img.id === image.id })))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyImageId(null)
    }
  }

  async function saveAltText(image: ItemImageRow, altText: string) {
    if (altText === (image.alt_text ?? '')) return
    setError(null)
    try {
      await updateImageAltText(image.id, altText)
      setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, alt_text: altText || null } : img)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return {
    images: [...images].sort((a, b) => a.position - b.position),
    isLoading,
    error,
    validationErrors,
    uploadQueue,
    busyImageId,
    addFiles,
    dismissQueueItem,
    removeImage,
    replaceImage,
    moveImage,
    makeCover,
    saveAltText,
  }
}
