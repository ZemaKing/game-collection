import { describe, expect, it } from 'vitest'
import {
  collectionSince,
  computeStatistics,
  effectiveAddedDate,
  MONTHS_SHOWN,
  type StatsRow,
} from '@/features/statistics/statistics'

// Local-time "now" so month/day math matches what the code does (it reads local time).
const NOW = new Date(2026, 8, 19, 12, 0, 0) // 19 Sep 2026

function row(overrides: Partial<StatsRow> = {}): StatsRow {
  return {
    item_type: 'game',
    subtitle: null,
    platform_id: null,
    release_date: null,
    collection_date: null,
    condition: null,
    description: null,
    cover_image_path: null,
    created_at: new Date(2026, 8, 1, 9).toISOString(),
    ...overrides,
  }
}

const FULL_GAME: Partial<StatsRow> = {
  subtitle: 'Studio',
  platform_id: 'p1',
  release_date: '2020-01-01',
  collection_date: '2026-09-10',
  condition: 'mint',
  description: 'desc',
  cover_image_path: 'a/b.jpg',
}

describe('computeStatistics', () => {
  it('handles an empty collection', () => {
    const stats = computeStatistics([], NOW)
    expect(stats.total).toBe(0)
    expect(stats.byPlatform).toEqual([])
    expect(stats.byCondition).toEqual([])
    expect(stats.earlierCount).toBe(0)
    expect(stats.addedLastWindow).toBe(0)
    expect(stats.completeness.average).toBe(0)
    expect(stats.completeness.buckets.every((b) => b.count === 0)).toBe(true)
    expect(stats.monthly).toHaveLength(MONTHS_SHOWN)
  })

  it('counts items by type', () => {
    const stats = computeStatistics(
      [row(), row(), row({ item_type: 'figure' }), row({ item_type: 'steelbook' })],
      NOW,
    )
    expect(stats.total).toBe(4)
    expect(stats.byType).toEqual({
      game: 2,
      special_edition: 0,
      steelbook: 1,
      artbook: 0,
      figure: 1,
      stuff: 0,
      dlc: 0,
    })
  })

  it('breaks platforms down for platform-capable types only, most common first, unset last', () => {
    const stats = computeStatistics(
      [
        row({ platform_id: 'a' }),
        row({ platform_id: 'b' }),
        row({ platform_id: 'b' }),
        row({ item_type: 'steelbook', platform_id: null }),
        row({ item_type: 'figure', platform_id: null }),
        row({ item_type: 'artbook', platform_id: 'a' }),
      ],
      NOW,
    )
    expect(stats.byPlatform).toEqual([
      { platformId: 'b', count: 2 },
      { platformId: 'a', count: 1 },
      { platformId: null, count: 1 },
    ])
  })

  it('breaks conditions down in tier order with unset last, skipping absent tiers', () => {
    const stats = computeStatistics(
      [
        row({ condition: 'poor' }),
        row({ condition: 'sealed' }),
        row({ condition: 'sealed' }),
        row({ condition: null }),
        row({ item_type: 'stuff', condition: 'good' }),
      ],
      NOW,
    )
    expect(stats.byCondition).toEqual([
      { condition: 'sealed', count: 2 },
      { condition: 'good', count: 1 },
      { condition: 'poor', count: 1 },
      { condition: null, count: 1 },
    ])
  })

  it('buckets additions by month, preferring collection_date over created_at', () => {
    const stats = computeStatistics(
      [
        row({ collection_date: '2026-09-02' }),
        row({ collection_date: '2026-09-30' }),
        row({ collection_date: '2026-08-15' }),
        // No collection date → falls back to created_at (March 2026).
        row({ created_at: new Date(2026, 2, 5, 10).toISOString() }),
      ],
      NOW,
    )
    const byKey = Object.fromEntries(stats.monthly.map((m) => [m.key, m.count]))
    expect(byKey['2026-09']).toBe(2)
    expect(byKey['2026-08']).toBe(1)
    expect(byKey['2026-03']).toBe(1)
    expect(stats.monthly[0].key).toBe('2025-10')
    expect(stats.monthly[MONTHS_SHOWN - 1].key).toBe('2026-09')
  })

  it('counts items older than the window as earlier and ignores future-dated ones in the chart', () => {
    const stats = computeStatistics(
      [
        row({ collection_date: '2025-09-30' }), // month before window start (Oct 2025)
        row({ collection_date: '2025-10-01' }), // first month in the window
        row({ collection_date: '2027-01-01' }), // future
      ],
      NOW,
    )
    expect(stats.earlierCount).toBe(1)
    expect(stats.monthly[0].count).toBe(1)
    expect(stats.monthly.reduce((sum, m) => sum + m.count, 0)).toBe(1)
  })

  it('counts items added within the last 30 days', () => {
    const stats = computeStatistics(
      [
        row({ collection_date: '2026-09-19' }),
        row({ collection_date: '2026-08-25' }),
        row({ collection_date: '2026-08-10' }), // 40 days ago
        row({ collection_date: '2026-10-01' }), // future
      ],
      NOW,
    )
    expect(stats.addedLastWindow).toBe(2)
  })

  it('computes average, fully-complete count and distribution', () => {
    // Game: 7 applicable fields. Full = 100%; empty = 0%; 4/7 filled ≈ 57%.
    const partial: Partial<StatsRow> = {
      subtitle: 'Studio',
      platform_id: 'p1',
      release_date: '2020-01-01',
      condition: 'mint',
    }
    const stats = computeStatistics(
      [row(FULL_GAME), row(), row(partial)],
      NOW,
    )
    expect(stats.completeness.complete).toBe(1)
    expect(stats.completeness.average).toBe(Math.round((100 + 0 + 57) / 3))
    const counts = stats.completeness.buckets.map((b) => b.count)
    expect(counts).toEqual([1, 0, 1, 0, 1])
    expect(counts.reduce((a, b) => a + b, 0)).toBe(stats.total)
  })
})

describe('collectionSince', () => {
  it('is null for an empty collection', () => {
    expect(collectionSince([])).toBeNull()
  })

  it('is the earliest added date, preferring a back-dated collection date over created_at', () => {
    const since = collectionSince([
      row({ collection_date: '2026-05-10' }),
      // Created last month but bought years ago.
      row({ collection_date: '2019-11-03', created_at: new Date(2026, 7, 1, 9).toISOString() }),
      row({ created_at: new Date(2024, 0, 15, 9).toISOString() }),
    ])
    expect(since && [since.getFullYear(), since.getMonth(), since.getDate()]).toEqual([2019, 10, 3])
  })

  it('falls back to created_at when no item has a collection date', () => {
    const since = collectionSince([
      row({ created_at: new Date(2026, 8, 1, 9).toISOString() }),
      row({ created_at: new Date(2026, 2, 5, 10).toISOString() }),
    ])
    expect(since && [since.getFullYear(), since.getMonth()]).toEqual([2026, 2])
  })
})

describe('effectiveAddedDate', () => {
  it('reads a plain collection date as local midnight', () => {
    const d = effectiveAddedDate({ collection_date: '2026-03-04', created_at: '2020-01-01T00:00:00Z' })
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 4])
  })

  it('falls back to created_at', () => {
    const iso = new Date(2026, 5, 7, 15).toISOString()
    expect(effectiveAddedDate({ collection_date: null, created_at: iso }).getTime()).toBe(new Date(iso).getTime())
  })
})
