import { describe, expect, it } from 'vitest'

import { variantSettings } from '../images/convert.ts'
import { emptyManifest, type Manifest } from '../images/manifest.ts'
import job, { type ImageRow } from './job.ts'
import { planPrune } from './prune.ts'

const ITEM = '00106ab0-b028-44e0-8787-217bc9f637f6'
const publicUrl = (path: string) => `https://cdn.test/${path}`
const fullPath = (id: string) => `game/${ITEM}/${id}.webp`
const thumbPath = (id: string) => `game/${ITEM}/${id}.thumb.webp`
const originalOf = (id: string) => `game/${ITEM}/upload-${id}.png`

// A row after the Phase 34 flip: serving its WebPs, the original kept in original_path.
const flipped = (id: string, extra: Partial<ImageRow> = {}): ImageRow => ({
  id,
  item_type: 'game',
  item_id: ITEM,
  storage_path: fullPath(id),
  thumb_path: thumbPath(id),
  original_path: originalOf(id),
  width: 1600,
  height: 900,
  ...extra,
})

function uploaded(manifest: Manifest, id: string, sourcePath = originalOf(id)) {
  for (const variant of job.variants) {
    const path = variant.name === 'thumb' ? thumbPath(id) : fullPath(id)
    manifest.objects[path] = {
      source: id,
      sourceUrl: publicUrl(sourcePath),
      sourceSha256: 'src',
      sourceBytes: 900_000,
      sourceWidth: 1920,
      sourceHeight: 1080,
      variant: variant.name,
      settings: variantSettings(variant),
      contentType: 'image/webp',
      sha256: `${variant.name}-sha`,
      bytes: 50_000,
      width: 600,
      height: 338,
      uploadedAt: '2026-10-10T00:00:00.000Z',
    }
  }
}

describe('planPrune', () => {
  it("deletes a flipped row's backed-up original and clears only original_path", () => {
    const manifest = emptyManifest(job.name, job.bucket)
    uploaded(manifest, 'a')
    const backup = new Map([[originalOf('a'), 'sha-a']])
    const plan = planPrune(job, [flipped('a')], manifest, backup, publicUrl)
    expect(plan.problems).toEqual([])
    expect(plan.deletions).toEqual([
      { id: 'a', path: originalOf('a'), sha256: 'sha-a' },
    ])
    expect(plan.clear).toEqual([
      {
        id: 'a',
        expected_storage_path: fullPath('a'),
        storage_path: fullPath('a'),
        thumb_path: thumbPath('a'),
        width: 1600,
        height: 900,
        original_path: null,
      },
    ])
    expect(Object.keys(plan.objects).sort()).toEqual(
      [fullPath('a'), thumbPath('a')].sort(),
    )
  })

  it('ignores rows without an original (born WebP, or already pruned)', () => {
    const born = flipped('n', { original_path: null })
    const plan = planPrune(
      job,
      [born],
      emptyManifest(job.name, job.bucket),
      new Map(),
      publicUrl,
    )
    expect(plan).toMatchObject({ deletions: [], clear: [], problems: [] })
  })

  it('refuses a row that was rolled back, lacks its WebPs, or whose original is not backed up', () => {
    const manifest = emptyManifest(job.name, job.bucket)
    uploaded(manifest, 'r')
    uploaded(manifest, 'b')
    uploaded(manifest, 'o', 'game/other.png') // made from a different original
    const rolledBack = flipped('r', { storage_path: originalOf('r') })
    const notBackedUp = flipped('b')
    const otherSource = flipped('o')
    const missing = flipped('m') // nothing uploaded
    const backup = new Map([
      [originalOf('r'), 'x'],
      [originalOf('o'), 'x'],
      [originalOf('m'), 'x'],
    ])
    const plan = planPrune(
      job,
      [rolledBack, notBackedUp, otherSource, missing],
      manifest,
      backup,
      publicUrl,
    )
    expect(plan.deletions).toEqual([])
    expect(plan.problems).toHaveLength(4)
    expect(plan.problems[0]).toContain("doesn't point at its WebPs")
    expect(plan.problems[1]).toContain("isn't in the local backup")
    expect(plan.problems[2]).toContain(
      "isn't in the manifest from this original",
    )
    expect(plan.problems[3]).toContain(
      "isn't in the manifest from this original",
    )
  })

  it('never deletes a path another row still serves', () => {
    const manifest = emptyManifest(job.name, job.bucket)
    uploaded(manifest, 'a')
    const sharer = flipped('s', {
      storage_path: originalOf('a'),
      thumb_path: null,
      original_path: null,
    })
    const plan = planPrune(
      job,
      [flipped('a'), sharer],
      manifest,
      new Map([[originalOf('a'), 'sha']]),
      publicUrl,
    )
    expect(plan.deletions).toEqual([])
    expect(plan.problems[0]).toContain('still served by a row')
  })
})
