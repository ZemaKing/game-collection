import { describe, expect, it } from 'vitest'
import {
  combineIdRestrictions,
  pageRange,
  releaseYearsExpression,
} from '@/features/items/listingQuery'

describe('combineIdRestrictions', () => {
  it('is null when neither facet is active', () => {
    expect(combineIdRestrictions(null, null)).toBeNull()
  })

  it('uses whichever facet is active', () => {
    expect(combineIdRestrictions(new Set(['a', 'b']), null)).toEqual(['a', 'b'])
    expect(combineIdRestrictions(null, new Set(['c']))).toEqual(['c'])
  })

  it('intersects when both are active', () => {
    expect(
      combineIdRestrictions(new Set(['a', 'b', 'c']), new Set(['b', 'c', 'd'])),
    ).toEqual(['b', 'c'])
  })

  it('returns an empty list (nothing can match), not null, when an active facet matches nothing', () => {
    expect(combineIdRestrictions(new Set(), null)).toEqual([])
    expect(combineIdRestrictions(new Set(['a']), new Set(['b']))).toEqual([])
  })
})

describe('releaseYearsExpression', () => {
  it('is null without years', () => {
    expect(releaseYearsExpression([])).toBeNull()
  })

  it('matches each year as a full calendar-year range', () => {
    expect(releaseYearsExpression([2017, 2023])).toBe(
      'and(release_date.gte.2017-01-01,release_date.lte.2017-12-31),' +
        'and(release_date.gte.2023-01-01,release_date.lte.2023-12-31)',
    )
  })

  it('drops values that are not plain years, so nothing else reaches the expression', () => {
    expect(releaseYearsExpression([Number.NaN, 1.5, -1, 10000])).toBeNull()
    expect(releaseYearsExpression([999])).toBe(
      'and(release_date.gte.0999-01-01,release_date.lte.0999-12-31)',
    )
  })
})

describe('pageRange', () => {
  it('gives inclusive bounds for zero-based pages', () => {
    expect(pageRange(0, 24)).toEqual({ from: 0, to: 23 })
    expect(pageRange(2, 24)).toEqual({ from: 48, to: 71 })
  })
})
