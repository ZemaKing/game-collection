import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { plannedPaths } from '../images/batch.ts'
import { variantSettings } from '../images/convert.ts'
import { emptyManifest } from '../images/manifest.ts'
import { localPathFor } from '../lib/imageMeta.mjs'
import smallJob, {
  fileBase,
  planSmall,
  type SmallRow,
  smallPathFor,
  smallSource,
} from './small-job.ts'

const ITEM = '00106ab0-b028-44e0-8787-217bc9f637f6'
const publicUrl = (path: string) => `https://cdn.test/${path}`
const root = join('tmp', 'backup')

const row = (id: string, extra: Partial<SmallRow> = {}): SmallRow => ({
  id,
  item_type: 'figure',
  item_id: ITEM,
  storage_path: `figure/${ITEM}/${id}.webp`,
  thumb_path: `figure/${ITEM}/${id}.thumb.webp`,
  ...extra,
})

describe('small image job', () => {
  it('is a 4:5 cover crop at 400×500 named next to the full image', () => {
    expect(smallJob.variants).toEqual([
      {
        name: 'small',
        maxWidth: 400,
        maxHeight: 500,
        quality: 85,
        fit: 'cover',
      },
    ])
    expect(variantSettings(smallJob.variants[0])).toBe(
      'small:webp:400x500:cover:q85',
    )
    const r = row('a', { storage_path: `figure/${ITEM}/up-load.png` })
    expect(fileBase(r.storage_path)).toBe('up-load')
    const source = smallSource(
      r,
      new Map(),
      new Map(),
      publicUrl,
      root,
      () => false,
    )
    expect(plannedPaths(smallJob, source).map((p) => p.path)).toEqual([
      smallPathFor(r),
    ])
    expect(smallPathFor(r)).toBe(`figure/${ITEM}/up-load.small.webp`)
  })

  it('reads a migrated row from its pruned original in the backup, never from the URL', () => {
    const r = row('m')
    const original = `figure/${ITEM}/orig.png`
    const source = smallSource(
      r,
      new Map([['m', { path: original, sha256: 'sha-o' }]]),
      new Map(),
      publicUrl,
      root,
      () => false,
    )
    expect(source).toMatchObject({
      url: publicUrl(original),
      file: localPathFor(root, original),
      sha256: 'sha-o',
    })
  })

  it('uses the backed-up full image when it is on disk, else downloads it', () => {
    const r = row('b')
    const backup = new Map([[r.storage_path, 'sha-b']])
    expect(
      smallSource(r, new Map(), backup, publicUrl, root, () => true),
    ).toMatchObject({
      file: localPathFor(root, r.storage_path),
      sha256: 'sha-b',
    })
    const downloaded = smallSource(
      r,
      new Map(),
      backup,
      publicUrl,
      root,
      () => false,
    )
    expect(downloaded.file).toBeUndefined()
    expect(downloaded.url).toBe(publicUrl(r.storage_path))
  })

  it('plans small_path only for rows whose small image is uploaded from their current source', () => {
    const done = row('d')
    const notUploaded = row('n')
    const alreadySet = row('s', { small_path: `figure/${ITEM}/s.small.webp` })
    const sourceOf = (r: SmallRow) =>
      smallSource(r, new Map(), new Map(), publicUrl, root, () => false)
    const manifest = emptyManifest(smallJob.name, smallJob.bucket)
    manifest.objects[smallPathFor(done)] = {
      source: 'd',
      sourceUrl: publicUrl(done.storage_path),
      sourceSha256: 'x',
      sourceBytes: 1,
      sourceWidth: 1600,
      sourceHeight: 900,
      variant: 'small',
      settings: variantSettings(smallJob.variants[0]),
      contentType: 'image/webp',
      sha256: 'y',
      bytes: 12_000,
      width: 400,
      height: 500,
      uploadedAt: '2026-10-10T00:00:00.000Z',
    }
    const plan = planSmall(
      smallJob,
      [done, notUploaded, alreadySet],
      manifest,
      sourceOf,
    )
    expect(plan.rows).toEqual([
      {
        id: 'd',
        expected_storage_path: done.storage_path,
        small_path: smallPathFor(done),
      },
    ])
    expect(plan.missing).toEqual(['n'])
    expect(plan.unchanged).toBe(1)
  })
})
