import { describe, expect, it } from 'vitest'
import { analyzeImages, renderAuditMarkdown } from './imageAudit.mjs'

const object = (path, size, mimetype = 'image/png', eTag = path) => ({
  path,
  size,
  mimetype,
  eTag,
  cacheControl: 'max-age=3600',
})
const row = (id, item_type, item_id, storage_path, is_cover = false) => ({
  id,
  item_type,
  item_id,
  storage_path,
  is_cover,
})

describe('analyzeImages', () => {
  const objects = [
    object('game/g1/a.png', 2_000_000),
    object('game/g1/b.jpg', 500_000, 'image/jpeg', 'same'),
    object('steelbook/s1/c.jpg', 500_000, 'image/jpeg', 'same'),
    object('stuff/x1/orphan.webp', 40_000, 'image/webp'),
  ]
  const rows = [
    row('r1', 'game', 'g1', 'game/g1/a.png', true),
    row('r2', 'game', 'g1', 'game/g1/b.jpg'),
    row('r3', 'steelbook', 's1', 'steelbook/s1/c.jpg'),
    row('r4', 'figure', 'f1', 'figure/f1/missing.png', true),
    row('r5', 'game', 'g2', 'steelbook/s1/c.jpg'),
  ]
  const items = [
    { id: 'g1', item_type: 'game' },
    { id: 'g2', item_type: 'game' },
    { id: 's1', item_type: 'steelbook' },
    { id: 'f1', item_type: 'figure' },
    { id: 'e1', item_type: 'artbook' },
  ]
  const a = analyzeImages({ rows, objects, items })

  it('totals and groups by format and type', () => {
    expect(a.totals).toEqual({
      rows: 5,
      objects: 4,
      bytes: 3_040_000,
      items: 5,
      itemsWithImages: 4,
    })
    expect(
      Object.fromEntries(a.byFormat.map(([f, e]) => [f, e.count])),
    ).toEqual({ PNG: 1, JPEG: 2, WebP: 1 })
    expect(a.byType[0]).toEqual([
      'game',
      { count: 2, bytes: 2_500_000, max: 2_000_000 },
    ])
  })

  it('finds broken rows, orphans, shared paths, duplicates and mismatches', () => {
    expect(a.rowsWithoutObject.map((r) => r.id)).toEqual(['r4'])
    expect(a.objectsWithoutRow.map((o) => o.path)).toEqual([
      'stuff/x1/orphan.webp',
    ])
    expect(a.sharedPaths).toEqual([{ path: 'steelbook/s1/c.jpg', rows: 2 }])
    expect(a.duplicateContent).toEqual([
      ['game/g1/b.jpg', 'steelbook/s1/c.jpg'],
    ])
    expect(a.pathMismatches.map((r) => r.id)).toEqual(['r5'])
    expect(a.itemsWithoutImages).toBe(1)
    expect(a.itemsWithoutCover).toBe(2) // s1 and g2
  })

  it('puts every object in exactly one size band', () => {
    expect(a.bands.reduce((sum, [, n]) => sum + n, 0)).toBe(objects.length)
  })

  it("counts a row's thumbnail and kept original as owned, not orphans", () => {
    const variants = analyzeImages({
      rows: [
        {
          ...row('r6', 'stuff', 'x2', 'stuff/x2/d.webp'),
          thumb_path: 'stuff/x2/d.thumb.webp',
          original_path: 'stuff/x2/d.png',
        },
      ],
      objects: [
        object('stuff/x2/d.webp', 90_000, 'image/webp'),
        object('stuff/x2/d.thumb.webp', 30_000, 'image/webp'),
        object('stuff/x2/d.png', 900_000),
      ],
      items: [{ id: 'x2', item_type: 'stuff' }],
    })
    expect(variants.objectsWithoutRow).toEqual([])
  })

  it('renders the report', () => {
    const md = renderAuditMarkdown(a, '2026-10-09 07:00 UTC')
    expect(md).toContain(
      '**Objects without a row** (orphans, wasted space): 1 — 40.0 kB',
    )
    expect(md).toContain('| PNG | 1 | 2.00 MB |')
  })
})
