import { calculateCompleteness, completenessFactsFromRow } from '@/features/items/completeness'
import { ITEM_CONDITIONS, ITEM_TYPES } from '@/features/items/constants'
import type { AllItemRow, ItemCondition, ItemType } from '@/features/items/types'

/** The `all_items` columns the statistics page needs — enough for every breakdown and for completeness. */
export type StatsRow = Pick<
  AllItemRow,
  | 'item_type'
  | 'subtitle'
  | 'platform_id'
  | 'release_date'
  | 'collection_date'
  | 'condition'
  | 'description'
  | 'cover_image_path'
  | 'created_at'
>

/**
 * Only these types can carry a platform (the `all_items` view hard-codes it to
 * null for the rest), so the platform breakdown is scoped to them — otherwise
 * every artbook/figure/stuff would pile up under a meaningless "Not set".
 */
const PLATFORM_ITEM_TYPES: ItemType[] = ['game', 'special_edition', 'steelbook']

export const MONTHS_SHOWN = 12
export const RECENT_WINDOW_DAYS = 30

/** Inclusive completeness ranges shown in the distribution; every 0-100 percent falls in exactly one. */
export const COMPLETENESS_BUCKETS: { min: number; max: number }[] = [
  { min: 0, max: 24 },
  { min: 25, max: 49 },
  { min: 50, max: 74 },
  { min: 75, max: 99 },
  { min: 100, max: 100 },
]

export interface PlatformCount {
  /** `null` = a platform-capable item with no platform set. */
  platformId: string | null
  count: number
}

export interface ConditionCount {
  /** `null` = condition not set. */
  condition: ItemCondition | null
  count: number
}

export interface MonthCount {
  /** Local-time month start, `YYYY-MM`. */
  key: string
  year: number
  /** 0-11 */
  month: number
  count: number
}

export interface CompletenessBucketCount {
  min: number
  max: number
  count: number
}

export interface CollectionStatistics {
  total: number
  byType: Record<ItemType, number>
  /** Platform-capable items only, most common first, "not set" last. */
  byPlatform: PlatformCount[]
  /** Only conditions that occur, in tier order (sealed → poor), "not set" last. */
  byCondition: ConditionCount[]
  /** Exactly `MONTHS_SHOWN` consecutive months ending with the current one, oldest first. */
  monthly: MonthCount[]
  /** Items dated before the first month shown. */
  earlierCount: number
  addedLastWindow: number
  completeness: {
    /** Mean of per-item completeness, rounded; 0 for an empty collection. */
    average: number
    /** Items at 100%. */
    complete: number
    buckets: CompletenessBucketCount[]
  }
}

/**
 * The date an item counts as "added" on: the owner-entered collection date
 * when there is one, otherwise the moment the row was created. Collection
 * dates are plain `YYYY-MM-DD` (parsed as local midnight, so they never shift
 * a day across timezones); `created_at` is a timestamp read in local time.
 */
export function effectiveAddedDate(row: Pick<StatsRow, 'collection_date' | 'created_at'>): Date {
  if (row.collection_date) {
    const [year, month, day] = row.collection_date.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(row.created_at)
}

/**
 * When the collection began: the earliest "added" date of any item (see
 * `effectiveAddedDate`), or `null` for an empty collection. A collection date
 * can be back-dated to when an item was actually bought, so this can precede
 * the first row's `created_at` — which is the point.
 */
export function collectionSince(rows: Pick<StatsRow, 'collection_date' | 'created_at'>[]): Date | null {
  let earliest: Date | null = null
  for (const row of rows) {
    const added = effectiveAddedDate(row)
    if (earliest === null || added < earliest) earliest = added
  }
  return earliest
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/** Pure and deterministic for a given `now`, so it can be unit tested without mocking time. */
export function computeStatistics(rows: StatsRow[], now: Date = new Date()): CollectionStatistics {
  const byType = Object.fromEntries(ITEM_TYPES.map((type) => [type, 0])) as Record<ItemType, number>
  const platformCounts = new Map<string | null, number>()
  const conditionCounts = new Map<ItemCondition | null, number>()
  const completenessCounts = COMPLETENESS_BUCKETS.map(({ min, max }) => ({ min, max, count: 0 }))

  // Oldest → newest, ending with the current month.
  const monthly: MonthCount[] = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1 - i), 1)
    return { key: monthKey(d.getFullYear(), d.getMonth()), year: d.getFullYear(), month: d.getMonth(), count: 0 }
  })
  const monthByKey = new Map(monthly.map((m) => [m.key, m]))
  const firstMonthStart = new Date(monthly[0].year, monthly[0].month, 1)
  const windowStart = new Date(now.getTime() - RECENT_WINDOW_DAYS * 86_400_000)

  let earlierCount = 0
  let addedLastWindow = 0
  let percentSum = 0
  let complete = 0

  for (const row of rows) {
    byType[row.item_type] += 1

    if (PLATFORM_ITEM_TYPES.includes(row.item_type)) {
      platformCounts.set(row.platform_id, (platformCounts.get(row.platform_id) ?? 0) + 1)
    }
    conditionCounts.set(row.condition, (conditionCounts.get(row.condition) ?? 0) + 1)

    const added = effectiveAddedDate(row)
    if (added < firstMonthStart) {
      earlierCount += 1
    } else {
      // Future-dated items (a collection date set ahead of time) match no bucket.
      const bucket = monthByKey.get(monthKey(added.getFullYear(), added.getMonth()))
      if (bucket) bucket.count += 1
    }
    if (added >= windowStart && added <= now) addedLastWindow += 1

    const { percent } = calculateCompleteness(row.item_type, completenessFactsFromRow(row))
    percentSum += percent
    if (percent === 100) complete += 1
    const target = completenessCounts.find((b) => percent >= b.min && percent <= b.max)
    if (target) target.count += 1
  }

  const byPlatform = Array.from(platformCounts, ([platformId, count]) => ({ platformId, count })).sort(
    (a, b) => {
      if (a.platformId === null) return 1
      if (b.platformId === null) return -1
      return b.count - a.count
    },
  )

  const byCondition = [...ITEM_CONDITIONS, null]
    .map((condition) => ({ condition, count: conditionCounts.get(condition) ?? 0 }))
    .filter((entry) => entry.count > 0)

  return {
    total: rows.length,
    byType,
    byPlatform,
    byCondition,
    monthly,
    earlierCount,
    addedLastWindow,
    completeness: {
      average: rows.length === 0 ? 0 : Math.round(percentSum / rows.length),
      complete,
      buckets: completenessCounts,
    },
  }
}
