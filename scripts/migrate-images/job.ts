// The games image job for the generic pipeline in scripts/images/ (ROADMAP Phase 33).
// Sources are the item_images rows. Each original is read from the local backup (Phase 32,
// backups/images/), never downloaded, and checked against the backup's sha256; it becomes two
// WebP objects next to it, named after the row id (stable across runs, and never the original's
// own name — 32 originals are already .webp):
//   {item_type}/{item_id}/{row id}.webp        full: fits 1600×1600
//   {item_type}/{item_id}/{row id}.thumb.webp  thumb: fits 600×750 (2× the widest 4:5 card)
// Sizes were measured on the app's cards/viewer and on real backup images; quality 85 is the
// owner's choice (2026-10-09). Nothing here changes a row: the flip is Phase 34.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { SupabaseClient } from '@supabase/supabase-js'

import { plannedPaths } from '../images/batch.ts'
import type { ImageJob, ImageSource } from '../images/types.ts'
import { localPathFor } from '../lib/imageMeta.mjs'
import {
  IMAGE_CACHE_SECONDS,
  IMAGE_VARIANTS,
} from '../../src/features/items/imageVariants.ts'

export const BUCKET = 'item-images'
export const BACKUP_ROOT = resolve('backups', 'images')
const PAGE = 1000

export type ImageRow = {
  id: string
  item_type: string
  item_id: string
  storage_path: string
  thumb_path?: string | null // absent before the Phase 33 migration
  small_path?: string | null // Phase 39 gap 3 (migration 20261013120000)
  original_path?: string | null // set by the Phase 34 flip; absent before the migration is applied
  width?: number | null
  height?: number | null
}

// The backup manifest's sha256 per Storage path (scripts/images-backup.mjs).
export type BackupIndex = Map<string, string>

export function loadBackupIndex(root = BACKUP_ROOT): BackupIndex {
  const file = resolve(root, 'manifest.json')
  if (!existsSync(file))
    throw new Error(
      `${file} not found — run \`npm run images:backup\` first (the job reads originals from it).`,
    )
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as {
    files: { path: string; sha256: string }[]
  }
  return new Map(manifest.files.map((f) => [f.path, f.sha256]))
}

export async function loadImageRows(
  supabase: SupabaseClient,
): Promise<ImageRow[]> {
  // "*" so the dry run also works before the Phase 33 migration adds original_path.
  // Paged: PostgREST caps a response at 1000 rows.
  const rows: ImageRow[] = []
  let total: number | null = null
  for (let from = 0; ; from += PAGE) {
    const { data, error, count } = await supabase
      .from('item_images')
      .select('*', { count: 'exact' })
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`Reading item_images failed: ${error.message}`)
    total ??= count
    rows.push(...(data as ImageRow[]))
    if (data.length < PAGE) break
  }
  if (total !== rows.length)
    throw new Error(`Read ${rows.length} of ${total} item_images rows.`)
  return rows
}

// Rows uploaded since Phase 36 are born WebP (thumb_path set, no original): nothing to convert,
// and they aren't in the backup. Flipped rows (original_path set) stay in, so re-runs and the
// manifest still cover them.
export const needsMigration = (row: ImageRow): boolean =>
  !row.thumb_path || !!row.original_path

// Before the flip storage_path is the original; after it, original_path is.
export const originalPath = (row: ImageRow): string =>
  row.original_path ?? row.storage_path

export function rowToSource(
  row: ImageRow,
  backup: BackupIndex,
  publicUrl: (path: string) => string,
  root = BACKUP_ROOT,
): ImageSource {
  const original = originalPath(row)
  return {
    key: row.id,
    url: publicUrl(original),
    file: localPathFor(root, original),
    sha256: backup.get(original),
    vars: { item_type: row.item_type, item_id: row.item_id, id: row.id },
  }
}

// Uploads use upsert, so an output that landed on an original's path would replace it. Row ids
// and upload names are both random UUIDs, so this never happens — but it is checked, not assumed.
export function assertNoOverwrite(
  job: ImageJob,
  sources: ImageSource[],
  rows: ImageRow[],
): void {
  const originals = new Set(rows.map(originalPath))
  for (const source of sources) {
    for (const { path } of plannedPaths(job, source)) {
      if (originals.has(path))
        throw new Error(
          `Output ${path} (row ${source.key}) is an original's path — refusing to overwrite it.`,
        )
    }
  }
}

const job: ImageJob = {
  name: 'game collection item images',
  bucket: BUCKET,
  pathPattern: '{item_type}/{item_id}/{id}.{ext}',
  variants: [
    { name: 'full', ...IMAGE_VARIANTS.full },
    {
      name: 'thumb',
      ...IMAGE_VARIANTS.thumb,
      pathPattern: '{item_type}/{item_id}/{id}.thumb.{ext}',
    },
  ],
  manifest: new URL('./manifest.json', import.meta.url),
  cacheControl: IMAGE_CACHE_SECONDS, // a year: every output path is new, so it is never overwritten with other content
  concurrency: 4,
  retries: 4,
  async sources(supabase) {
    const backup = loadBackupIndex()
    const publicUrl = (path: string) =>
      supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    const rows = (await loadImageRows(supabase)).filter(needsMigration)
    const sources = rows.map((row) => rowToSource(row, backup, publicUrl))
    assertNoOverwrite(job, sources, rows)
    return sources
  },
}

export default job
