import { useState } from 'react'
import { CoverPlaceholder } from '@/features/items/components/CoverPlaceholder'
import { getImagePublicUrl } from '@/features/items/storage'
import type { ItemType } from '@/features/items/types'

interface ItemImageProps {
  storagePath: string | null
  itemType: ItemType
  alt: string
  className?: string
  iconSize?: number
}

/**
 * Renders a real photo when `storagePath` is set, falling back to the type
 * placeholder both before load (as a backdrop, avoiding a blank flash) and
 * on load failure (broken/missing file). `className` carries all sizing
 * (aspect ratio, rounding, width) and applies the same way whether or not
 * an image ends up rendering.
 */
export function ItemImage({ storagePath, itemType, alt, className = '', iconSize }: ItemImageProps) {
  const [failed, setFailed] = useState(false)

  if (!storagePath || failed) {
    return <CoverPlaceholder itemType={itemType} className={className} iconSize={iconSize} />
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <CoverPlaceholder itemType={itemType} className="absolute inset-0 h-full w-full" iconSize={iconSize} />
      <img
        src={getImagePublicUrl(storagePath)}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}
