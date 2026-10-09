import { escapeLikePattern } from '@/features/items/likePattern'
import type { ItemType } from '@/features/items/types'

export interface DuplicateLookup {
  itemType: ItemType
  /** An `ilike` pattern with no wildcards: an exact, case-insensitive title match. */
  titlePattern: string
  /** DLCs only: match within this base game. */
  parentGameId: string | null
}

/**
 * The "likely duplicate" rule, without the query (ROADMAP Phase 40): same item type + same title,
 * case-insensitive after trimming; `%`, `_` and `\` in the title are escaped so they can't act as
 * wildcards. Deliberately title-only, no platform/publisher narrowing — confirmed with the owner
 * during planning as the simplest rule that still catches the common case (re-adding an item
 * already in the collection). DLC titles like "Season Pass" legitimately repeat across games, so a
 * DLC with a base game is only compared within that game. `null` means there is nothing to check.
 */
export function duplicateLookup(
  itemType: ItemType,
  title: string,
  parentGameId?: string,
): DuplicateLookup | null {
  const normalized = title.trim()
  if (!normalized) return null
  return {
    itemType,
    titlePattern: escapeLikePattern(normalized),
    parentGameId: itemType === 'dlc' && parentGameId ? parentGameId : null,
  }
}
