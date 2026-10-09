// Large-dataset check (ROADMAP Phase 39): the statistics page is the one place that processes every
// item in the browser (listings, search and duplicates are paged or capped by the server). Generated
// rows only — never written anywhere.
import { describe, expect, it } from 'vitest'
import { ITEM_CONDITIONS, ITEM_TYPES } from '@/features/items/constants'
import {
  computeStatistics,
  type StatsRow,
} from '@/features/statistics/statistics'

const NOW = new Date(2026, 9, 9, 12, 0, 0)

/** Deterministic rows spread over types, platforms, conditions and five years of dates. */
function generateRows(count: number): StatsRow[] {
  return Array.from({ length: count }, (_, i) => ({
    item_type: ITEM_TYPES[i % ITEM_TYPES.length],
    subtitle: i % 3 ? `Studio ${i % 40}` : null,
    platform_id: i % 4 ? `p${i % 9}` : null,
    release_date: i % 5 ? `${2000 + (i % 26)}-0${1 + (i % 9)}-15` : null,
    collection_date:
      i % 2
        ? `${2021 + (i % 5)}-${String(1 + (i % 12)).padStart(2, '0')}-01`
        : null,
    condition: i % 6 ? ITEM_CONDITIONS[i % ITEM_CONDITIONS.length] : null,
    has_description: i % 3 === 0,
    cover_image_path: i % 2 ? `game/${i}/cover.webp` : null,
    created_at: new Date(2021, i % 60, 1 + (i % 28)).toISOString(),
  }))
}

describe('computeStatistics at scale', () => {
  it.each([1_500, 15_000])(
    'handles %i items quickly and consistently',
    (count) => {
      const rows = generateRows(count)
      const start = performance.now()
      const stats = computeStatistics(rows, NOW)
      const ms = performance.now() - start

      expect(stats.total).toBe(count)
      expect(Object.values(stats.byType).reduce((a, b) => a + b, 0)).toBe(count)
      expect(stats.byCondition.reduce((a, b) => a + b.count, 0)).toBe(count)
      expect(stats.completeness.buckets.reduce((a, b) => a + b.count, 0)).toBe(
        count,
      )
      // Generous for slow CI machines; locally 1,500 items take a few ms.
      expect(ms).toBeLessThan(count <= 1_500 ? 100 : 750)
    },
  )
})
