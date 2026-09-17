import { ITEM_TYPE_META } from '@/features/items/constants'
import type { ItemType } from '@/features/items/types'

/**
 * Renders in place of a real cover image everywhere an item is shown. No
 * Storage bucket/objects exist yet (Phase 14), so every item is effectively
 * "missing its image" for now — this placeholder is that permanent
 * fallback until Phase 14 wires up real thumbnails.
 */
export function CoverPlaceholder({
  itemType,
  className = '',
  iconSize = 28,
}: {
  itemType: ItemType
  className?: string
  iconSize?: number
}) {
  const Icon = ITEM_TYPE_META[itemType].icon
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-card-hover text-muted ${className}`}
    >
      <Icon size={iconSize} strokeWidth={1.5} />
    </div>
  )
}
