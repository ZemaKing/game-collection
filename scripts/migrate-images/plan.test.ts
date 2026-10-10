import { describe, expect, it } from 'vitest'

import { variantSettings } from '../images/convert.ts'
import {
  emptyManifest,
  type Manifest,
  type ManifestEntry,
} from '../images/manifest.ts'
import job, { type ImageRow } from './job.ts'
import { planFlip, planRollback } from './plan.ts'

const ITEM = '00106ab0-b028-44e0-8787-217bc9f637f6'
const publicUrl = (path: string) => `https://cdn.test/${path}`

const row = (id: string, extra: Partial<ImageRow> = {}): ImageRow => ({
  id,
  item_type: 'game',
  item_id: ITEM,
  storage_path: `game/${ITEM}/upload-${id}.png`,
  thumb_path: null,
  original_path: null,
  width: null,
  height: null,
  ...extra,
})
const fullPath = (id: string) => `game/${ITEM}/${id}.webp`
const thumbPath = (id: string) => `game/${ITEM}/${id}.thumb.webp`

function uploaded(
  manifest: Manifest,
  r: ImageRow,
  variant: 'full' | 'thumb',
  overrides: Partial<ManifestEntry> = {},
) {
  const v = job.variants.find((x) => x.name === variant)!
  manifest.objects[variant === 'full' ? fullPath(r.id) : thumbPath(r.id)] = {
    source: r.id,
    sourceUrl: publicUrl(r.original_path ?? r.storage_path),
    sourceSha256: 'src',
    sourceBytes: 900_000,
    sourceWidth: 1920,
    sourceHeight: 1080,
    variant,
    settings: variantSettings(v),
    contentType: 'image/webp',
    sha256: `${variant}-sha`,
    bytes: variant === 'full' ? 110_000 : 25_000,
    width: variant === 'full' ? 1600 : 600,
    height: variant === 'full' ? 900 : 338,
    uploadedAt: '2026-10-10T00:00:00.000Z',
    ...overrides,
  }
}

const fresh = () => emptyManifest(job.name, job.bucket)

describe('planFlip', () => {
  it('points a row at its full + thumb WebP, keeps the original, and expects the current path', () => {
    const r = row('a')
    const manifest = fresh()
    uploaded(manifest, r, 'full')
    uploaded(manifest, r, 'thumb')
    const plan = planFlip(job, [r], manifest, publicUrl)
    expect(plan.problems).toEqual([])
    expect(plan.rows).toEqual([
      {
        id: 'a',
        expected_storage_path: r.storage_path,
        storage_path: fullPath('a'),
        thumb_path: thumbPath('a'),
        width: 1600,
        height: 900,
        original_path: r.storage_path,
      },
    ])
    expect(Object.keys(plan.objects).sort()).toEqual(
      [fullPath('a'), thumbPath('a')].sort(),
    )
  })

  it('blocks the whole flip when any variant is missing or was made from another original', () => {
    const ok = row('a')
    const missing = row('b')
    const stale = row('c')
    const manifest = fresh()
    uploaded(manifest, ok, 'full')
    uploaded(manifest, ok, 'thumb')
    uploaded(manifest, missing, 'full')
    uploaded(manifest, stale, 'full', { sourceUrl: publicUrl('other.png') })
    uploaded(manifest, stale, 'thumb')
    const plan = planFlip(job, [ok, missing, stale], manifest, publicUrl)
    expect(plan.problems).toHaveLength(2)
    expect(plan.problems[0]).toContain(`${thumbPath('b')} not uploaded`)
    expect(plan.problems[1]).toContain('another original')
  })

  it('leaves rows born WebP alone and counts flipped rows as unchanged', () => {
    const born = row('n', {
      storage_path: `game/${ITEM}/n.webp`,
      thumb_path: `game/${ITEM}/n.thumb.webp`,
      width: 800,
      height: 600,
    })
    const original = `game/${ITEM}/upload-f.png`
    const flipped = row('f', {
      storage_path: fullPath('f'),
      thumb_path: thumbPath('f'),
      original_path: original,
      width: 1600,
      height: 900,
    })
    const manifest = fresh()
    uploaded(manifest, flipped, 'full')
    uploaded(manifest, flipped, 'thumb')
    const plan = planFlip(job, [born, flipped], manifest, publicUrl)
    expect(plan).toMatchObject({ rows: [], problems: [], unchanged: 2 })
  })

  it('flags a row with an original whose storage_path is not its WebP', () => {
    const odd = row('x', {
      storage_path: `game/${ITEM}/something-else.webp`,
      thumb_path: thumbPath('x'),
      original_path: `game/${ITEM}/upload-x.png`,
    })
    const manifest = fresh()
    uploaded(manifest, odd, 'full')
    uploaded(manifest, odd, 'thumb')
    const plan = planFlip(job, [odd], manifest, publicUrl)
    expect(plan.rows).toEqual([])
    expect(plan.problems[0]).toContain('check it by hand')
  })
})

describe('planRollback', () => {
  it('restores the original and clears the variants, only for flipped rows', () => {
    const original = `game/${ITEM}/upload-f.png`
    const flipped = row('f', {
      storage_path: fullPath('f'),
      thumb_path: thumbPath('f'),
      original_path: original,
      width: 1600,
      height: 900,
    })
    const born = row('n', {
      storage_path: `game/${ITEM}/n.webp`,
      thumb_path: `game/${ITEM}/n.thumb.webp`,
    })
    const plan = planRollback([flipped, born, row('o')])
    expect(plan.unchanged).toBe(2)
    expect(plan.rows).toEqual([
      {
        id: 'f',
        expected_storage_path: fullPath('f'),
        storage_path: original,
        thumb_path: null,
        width: null,
        height: null,
        original_path: null,
      },
    ])
  })
})
