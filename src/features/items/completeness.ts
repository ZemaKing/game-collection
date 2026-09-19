import type { AllItemRow, ItemType } from '@/features/items/types'
import type { ItemDetail } from '@/features/items/detailTypes'

/**
 * Boolean facts feeding the completeness score. `hasSubtitle` stands in for
 * each type's single "key identifying field" — the same one the `all_items`
 * view already surfaces as `subtitle` (developer for games, edition_name for
 * special editions/steelbooks, publisher for artbooks, manufacturer for
 * figures, category for stuff). Using that one proxy field (rather than
 * every type-specific column individually) is what lets the exact same
 * `calculateCompleteness` run identically from a full `ItemDetail` *and*
 * from a lightweight `AllItemRow` listing row — no extra per-row queries
 * needed to show completeness on cards.
 */
export interface CompletenessFacts {
  hasSubtitle: boolean
  hasPlatform: boolean
  hasReleaseDate: boolean
  hasCollectionDate: boolean
  hasCondition: boolean
  hasDescription: boolean
  hasCoverImage: boolean
}

/**
 * `title` is excluded — it's already required to save an item (see
 * `schemas.ts` `commonFields.title`), so it would always be 100% and add
 * nothing to the score. `platform` is excluded for types that
 * don't have it (artbook/figure/stuff — see `all_items` view, which hard-
 * codes that column to null for those types).
 */
const APPLICABLE_FIELDS: Record<ItemType, (keyof CompletenessFacts)[]> = {
  game: [
    'hasSubtitle',
    'hasPlatform',
    'hasReleaseDate',
    'hasCollectionDate',
    'hasCondition',
    'hasDescription',
    'hasCoverImage',
  ],
  special_edition: [
    'hasSubtitle',
    'hasPlatform',
    'hasReleaseDate',
    'hasCollectionDate',
    'hasCondition',
    'hasDescription',
    'hasCoverImage',
  ],
  steelbook: [
    'hasSubtitle',
    'hasPlatform',
    'hasReleaseDate',
    'hasCollectionDate',
    'hasCondition',
    'hasDescription',
    'hasCoverImage',
  ],
  artbook: ['hasSubtitle', 'hasReleaseDate', 'hasCollectionDate', 'hasCondition', 'hasDescription', 'hasCoverImage'],
  figure: ['hasSubtitle', 'hasReleaseDate', 'hasCollectionDate', 'hasCondition', 'hasDescription', 'hasCoverImage'],
  stuff: ['hasSubtitle', 'hasReleaseDate', 'hasCollectionDate', 'hasCondition', 'hasDescription', 'hasCoverImage'],
}

export interface CompletenessResult {
  /** 0-100, rounded to the nearest whole percent. */
  percent: number
  filled: number
  total: number
}

/**
 * Deterministic, pure: same `facts` in, same result out — no I/O, so it
 * naturally "recalculates" every time it's called with fresh data (on every
 * render, since neither the detail page nor the listing cache anything).
 * Every field here is optional at the database level (see Phase 4 schema),
 * so a missing field simply doesn't count toward the numerator — there's no
 * partial credit or weighting between fields.
 */
export function calculateCompleteness(itemType: ItemType, facts: CompletenessFacts): CompletenessResult {
  const keys = APPLICABLE_FIELDS[itemType]
  const filled = keys.filter((key) => facts[key]).length
  const total = keys.length
  return { percent: total === 0 ? 100 : Math.round((filled / total) * 100), filled, total }
}

/** Adapter for listing/card surfaces, which only ever fetch `all_items` rows. */
export function completenessFactsFromRow(row: AllItemRow): CompletenessFacts {
  return {
    hasSubtitle: !!row.subtitle,
    hasPlatform: !!row.platform_id,
    hasReleaseDate: !!row.release_date,
    hasCollectionDate: !!row.collection_date,
    hasCondition: !!row.condition,
    hasDescription: !!row.description,
    hasCoverImage: !!row.cover_image_path,
  }
}

const DETAIL_SUBTITLE_BY_TYPE: Record<ItemType, (detail: ItemDetail) => string | null> = {
  game: (d) => d.developer,
  special_edition: (d) => d.edition_name,
  steelbook: (d) => d.edition_name,
  artbook: (d) => d.publisher,
  figure: (d) => d.manufacturer,
  stuff: (d) => d.category,
}

/** Adapter for the detail page, which fetches the full type-specific row. */
export function completenessFactsFromDetail(detail: ItemDetail, hasCoverImage: boolean): CompletenessFacts {
  return {
    hasSubtitle: !!DETAIL_SUBTITLE_BY_TYPE[detail.item_type](detail),
    hasPlatform: !!detail.platform,
    hasReleaseDate: !!detail.release_date,
    hasCollectionDate: !!detail.collection_date,
    hasCondition: !!detail.condition,
    hasDescription: !!detail.description,
    hasCoverImage,
  }
}
