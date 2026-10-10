// The `small` variant backfill (ROADMAP Phase 39, gap 3): a 4:5 crop at 400×500 next to every
// item image, for phone cards and small strips (src/features/items/imageSizes.ts). New uploads
// get it in the browser (imageApi.ts); this job makes it for the rows that predate that.
//
//   {item_type}/{item_id}/{name}.small.webp   next to the full image {name}.webp (or .png)
//
// Source, best first — the smallest egress and the least re-encoding:
//   1. a row migrated in Phase 34: its pre-WebP original from the local backup (prune-log.json
//      maps the row to it; the originals are gone from Storage since Phase 37);
//   2. otherwise the row's full image from the local backup (rows born WebP since Phase 36);
//   3. otherwise the full image downloaded from Storage (uploaded after the last backup).
// Local files are checked against the backup's sha256. Rows that already have small_path are
// skipped. `npm run images:small-flip` then writes small_path.
import { existsSync, readFileSync } from 'node:fs'

import type { SupabaseClient } from '@supabase/supabase-js'

import { plannedPaths } from '../images/batch.ts'
import {
  isDone,
  type Manifest,
  type ManifestEntry,
} from '../images/manifest.ts'
import type { ImageJob, ImageSource } from '../images/types.ts'
import { localPathFor } from '../lib/imageMeta.mjs'
import {
  IMAGE_CACHE_SECONDS,
  IMAGE_VARIANTS,
} from '../../src/features/items/imageVariants.ts'
import {
  BACKUP_ROOT,
  BUCKET,
  type BackupIndex,
  type ImageRow,
  loadBackupIndex,
  loadImageRows,
} from './job.ts'

export type SmallRow = ImageRow & { small_path?: string | null }

// Row id → the original Phase 37 deleted (path + sha256), from prune-log.json.
export type PrunedOriginals = Map<string, { path: string; sha256: string }>

const PRUNE_LOG = new URL('./prune-log.json', import.meta.url)

export function loadPrunedOriginals(file: URL = PRUNE_LOG): PrunedOriginals {
  if (!existsSync(file)) return new Map()
  const log = JSON.parse(readFileSync(file, 'utf8')) as {
    id: string
    path: string
    sha256: string
  }[]
  return new Map(log.map((e) => [e.id, { path: e.path, sha256: e.sha256 }]))
}

// The full image's file name without its extension: "game/x/abc.webp" → "abc".
export function fileBase(storagePath: string): string {
  const name = storagePath.split('/').pop() ?? ''
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

export const smallPathFor = (row: ImageRow): string =>
  `${row.item_type}/${row.item_id}/${fileBase(row.storage_path)}.small.webp`

export function smallSource(
  row: SmallRow,
  pruned: PrunedOriginals,
  backup: BackupIndex,
  publicUrl: (path: string) => string,
  root = BACKUP_ROOT,
  exists: (file: string) => boolean = existsSync,
): ImageSource {
  const vars = {
    item_type: row.item_type,
    item_id: row.item_id,
    name: fileBase(row.storage_path),
  }
  const original = pruned.get(row.id)
  if (original) {
    // Gone from Storage, so the local copy is the only source: no fallback to the URL.
    return {
      key: row.id,
      url: publicUrl(original.path),
      file: localPathFor(root, original.path),
      sha256: original.sha256,
      vars,
    }
  }
  const full = row.storage_path
  const file = localPathFor(root, full)
  const sha256 = backup.get(full)
  if (sha256 && exists(file))
    return { key: row.id, url: publicUrl(full), file, sha256, vars }
  return { key: row.id, url: publicUrl(full), vars }
}

const job: ImageJob = {
  name: 'game collection small images',
  bucket: BUCKET,
  pathPattern: '{item_type}/{item_id}/{name}.small.{ext}',
  variants: [{ name: 'small', ...IMAGE_VARIANTS.small }],
  manifest: new URL('./small-manifest.json', import.meta.url),
  cacheControl: IMAGE_CACHE_SECONDS,
  concurrency: 4,
  retries: 6,
  async sources(supabase: SupabaseClient) {
    const pruned = loadPrunedOriginals()
    const backup = loadBackupIndex()
    const publicUrl = (path: string) =>
      supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    const rows = (await loadImageRows(supabase)) as SmallRow[]
    return rows
      .filter((row) => !row.small_path)
      .map((row) => smallSource(row, pruned, backup, publicUrl))
  },
}

export default job

export type SmallFlipRow = {
  id: string
  expected_storage_path: string
  small_path: string
}

export type SmallPlan = {
  rows: SmallFlipRow[] // payload for set_item_image_small()
  objects: Record<string, ManifestEntry> // must answer HEAD before the rows point at them
  missing: string[] // rows without an uploaded small image — they keep the thumb
  unchanged: number
}

// Rows whose small image is in the manifest (made from this row's current source with the
// current settings) get small_path. The rest are listed, not blocking: srcset needs both
// files, so a row without small_path simply keeps loading its thumb.
export function planSmall(
  smallJob: ImageJob,
  rows: SmallRow[],
  manifest: Manifest,
  sourceOf: (row: SmallRow) => ImageSource,
): SmallPlan {
  const plan: SmallPlan = { rows: [], objects: {}, missing: [], unchanged: 0 }
  for (const row of rows) {
    if (row.small_path) {
      plan.unchanged++
      continue
    }
    const source = sourceOf(row)
    const [{ path, variant }] = plannedPaths(smallJob, source)
    if (!isDone(manifest, path, source, variant)) {
      plan.missing.push(row.id)
      continue
    }
    plan.objects[path] = manifest.objects[path]
    plan.rows.push({
      id: row.id,
      expected_storage_path: row.storage_path,
      small_path: path,
    })
  }
  return plan
}
