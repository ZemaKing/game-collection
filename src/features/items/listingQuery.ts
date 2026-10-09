// Pure pieces of the `fetchItems` listing query (api.ts), split out so they can be unit-tested
// without Supabase (ROADMAP Phase 40).

/**
 * Combines the genre and tag facets' matching item ids: intersected when both are active,
 * otherwise whichever is active. `null` means neither facet is active (no restriction), while
 * an empty array means nothing can match.
 */
export function combineIdRestrictions(
  genreItemIds: Set<string> | null,
  tagItemIds: Set<string> | null,
): string[] | null {
  if (genreItemIds && tagItemIds) {
    return Array.from(genreItemIds).filter((id) => tagItemIds.has(id))
  }
  if (!genreItemIds && !tagItemIds) return null
  return Array.from(genreItemIds ?? tagItemIds ?? [])
}

/**
 * The PostgREST `.or()` expression matching a release date in any of `years`, or `null` for no
 * year filter. `years` are parsed integers (see `parseFilters`), never raw user text, so they're
 * safe to interpolate into the hand-built expression; anything else is dropped as a safeguard.
 */
export function releaseYearsExpression(years: number[]): string | null {
  const valid = years.filter((y) => Number.isInteger(y) && y >= 0 && y <= 9999)
  if (!valid.length) return null
  return valid
    .map((y) => {
      const year = String(y).padStart(4, '0')
      return `and(release_date.gte.${year}-01-01,release_date.lte.${year}-12-31)`
    })
    .join(',')
}

/** Inclusive `.range()` bounds for a zero-based page. */
export function pageRange(
  page: number,
  pageSize: number,
): { from: number; to: number } {
  const from = page * pageSize
  return { from, to: from + pageSize - 1 }
}
