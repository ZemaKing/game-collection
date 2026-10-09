import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { plannedPaths } from '../images/batch.ts'
import job, { assertNoOverwrite, type ImageRow, rowToSource } from './job.ts'

const ITEM_TYPES = [
  'game',
  'special_edition',
  'steelbook',
  'artbook',
  'figure',
  'stuff',
  'dlc',
]
const ITEM = '00106ab0-b028-44e0-8787-217bc9f637f6'
const ROW = '8d3f2c1e-5b4a-4c6d-9e7f-0a1b2c3d4e5f'
const UPLOAD = '5496e49d-4309-48fe-8748-d71b56aff571'

const row = (item_type: string, extra: Partial<ImageRow> = {}): ImageRow => ({
  id: ROW,
  item_type,
  item_id: ITEM,
  storage_path: `${item_type}/${ITEM}/${UPLOAD}.png`,
  ...extra,
})
const publicUrl = (path: string) => `https://cdn.test/${path}`
const root = join('tmp', 'backup')

describe('games image job', () => {
  it('plans a full and a thumb WebP next to the original, named after the row, for every item type', () => {
    for (const type of ITEM_TYPES) {
      const source = rowToSource(row(type), new Map(), publicUrl, root)
      expect(
        plannedPaths(job, source).map(({ variant, path }) => [
          variant.name,
          path,
        ]),
      ).toEqual([
        ['full', `${type}/${ITEM}/${ROW}.webp`],
        ['thumb', `${type}/${ITEM}/${ROW}.thumb.webp`],
      ])
    }
  })

  it("reads the original from the local backup, with the backup's sha256 and its public URL as identity", () => {
    const path = `game/${ITEM}/${UPLOAD}.png`
    const source = rowToSource(
      row('game'),
      new Map([[path, 'ab'.repeat(32)]]),
      publicUrl,
      root,
    )
    expect(source).toMatchObject({
      key: ROW,
      url: `https://cdn.test/${path}`,
      file: join(root, 'game', ITEM, `${UPLOAD}.png`),
      sha256: 'ab'.repeat(32),
    })
  })

  it('uses original_path once the row has been flipped to WebP', () => {
    const flipped = row('game', {
      storage_path: `game/${ITEM}/${ROW}.webp`,
      original_path: `game/${ITEM}/${UPLOAD}.jpg`,
    })
    expect(rowToSource(flipped, new Map(), publicUrl, root).file).toBe(
      join(root, 'game', ITEM, `${UPLOAD}.jpg`),
    )
  })

  it('refuses an output that would overwrite an original', () => {
    const clash = row('game', { storage_path: `game/${ITEM}/${ROW}.webp` }) // an original named like the row
    expect(() =>
      assertNoOverwrite(
        job,
        [rowToSource(clash, new Map(), publicUrl, root)],
        [clash],
      ),
    ).toThrow('refusing to overwrite')
    const fine = row('game')
    expect(() =>
      assertNoOverwrite(
        job,
        [rowToSource(fine, new Map(), publicUrl, root)],
        [fine],
      ),
    ).not.toThrow()
  })

  it('rejects an unsafe original path from the database', () => {
    expect(() =>
      rowToSource(
        row('game', { storage_path: '../secrets.png' }),
        new Map(),
        publicUrl,
        root,
      ),
    ).toThrow('Unsafe')
  })

  it('uses the agreed variants and a year of caching', () => {
    expect(
      job.variants.map(({ name, maxWidth, maxHeight, quality }) => ({
        name,
        maxWidth,
        maxHeight,
        quality,
      })),
    ).toEqual([
      { name: 'full', maxWidth: 1600, maxHeight: undefined, quality: 85 },
      { name: 'thumb', maxWidth: 600, maxHeight: 750, quality: 85 },
    ])
    expect(job.cacheControl).toBe('31536000')
  })
})
