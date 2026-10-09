import { useState } from 'react'
import { CoverPlaceholder } from '@/features/items/components/CoverPlaceholder'
import { getImagePublicUrl, imagePathFor, type ImageVariant } from '@/features/items/storage'
import type { ItemType } from '@/features/items/types'
import { useSettings } from '@/hooks/useSettings'

interface ItemImageProps {
  /** The full image (`item_images.storage_path` / `all_items.cover_image_path`). */
  storagePath: string | null
  /** Its small WebP (`thumb_path` / `cover_thumb_path`), if the row has one yet. */
  thumbPath?: string | null
  /** `thumb` (default) for cards, strips and lists; `full` only for the detail image and the viewer. */
  variant?: ImageVariant
  /** Pixel size of the full image, when known: gives the `<img>` its intrinsic aspect ratio. */
  width?: number | null
  height?: number | null
  /** Above-the-fold image (the first row of cards): loads eagerly at high fetch priority. */
  priority?: boolean
  itemType: ItemType
  alt: string
  className?: string
  iconSize?: number
  fit?: 'cover' | 'contain'
  /** List/grid card thumbnails: skipped in the Settings "data saver" mode. Item pages and the viewer leave this off. */
  deferrable?: boolean
}

/**
 * Renders a real photo when `storagePath` is set, falling back to the type
 * placeholder both before load (as a backdrop, avoiding a blank flash) and
 * on load failure (broken/missing file). `className` carries all sizing
 * (aspect ratio, rounding, width) and applies the same way whether or not
 * an image ends up rendering. `fit` defaults to `cover` (thumbnails/covers);
 * use `contain` where the whole image must stay visible, e.g. the full-screen viewer.
 * `variant` picks the thumb (falling back to the full image until the row has
 * one, or if the thumb fails to load) or the full image. The Settings image-loading preference picks
 * lazy/eager loading (`priority` images are always eager), and in "saver"
 * mode `deferrable` thumbnails stay placeholders.
 */
export function ItemImage({
  storagePath,
  thumbPath,
  variant = 'thumb',
  width,
  height,
  priority = false,
  itemType,
  alt,
  className = '',
  iconSize,
  fit = 'cover',
  deferrable = false,
}: ItemImageProps) {
  const [failed, setFailed] = useState(false)
  // A thumb that fails to load falls back to the full image before giving up.
  const [thumbFailed, setThumbFailed] = useState(false)
  const { imageLoading } = useSettings().settings

  if (!storagePath || failed || (deferrable && imageLoading === 'saver')) {
    return <CoverPlaceholder itemType={itemType} className={className} iconSize={iconSize} />
  }

  const path = imagePathFor({ storage_path: storagePath, thumb_path: thumbPath }, thumbFailed ? 'full' : variant)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <CoverPlaceholder itemType={itemType} className="absolute inset-0 h-full w-full" iconSize={iconSize} />
      <img
        src={getImagePublicUrl(path)}
        alt={alt}
        width={width ?? undefined}
        height={height ?? undefined}
        decoding="async"
        loading={priority || imageLoading === 'eager' ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        onError={() => (path === storagePath ? setFailed(true) : setThumbFailed(true))}
        className={`absolute inset-0 h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
      />
    </div>
  )
}
