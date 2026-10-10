// Pure planning for Phase 37: which originals may be deleted from Storage. Unit-tested.
// An original is deletable only when its row already serves the WebPs this job made from it
// (both in the manifest, from that original, with the current settings), the original is in
// the local backup with a sha256, and no row uses the same path as its full image or thumbnail.
// Anything else is a problem, and any problem blocks the whole run.
import { plannedPaths } from '../images/batch.ts'
import {
  isDone,
  type Manifest,
  type ManifestEntry,
} from '../images/manifest.ts'
import type { ImageJob } from '../images/types.ts'
import { type BackupIndex, type ImageRow, rowToSource } from './job.ts'
import type { FlipRow } from './plan.ts'

export type Deletion = { id: string; path: string; sha256: string }

export type PrunePlan = {
  deletions: Deletion[] // originals to remove from Storage
  clear: FlipRow[] // set_item_image_variants() payload: original_path → null, the rest unchanged
  objects: Record<string, ManifestEntry> // the WebPs that must answer before anything is deleted
  problems: string[]
}

const THUMB = 'thumb'

export function planPrune(
  job: ImageJob,
  rows: ImageRow[],
  manifest: Manifest,
  backup: BackupIndex,
  publicUrl: (path: string) => string,
): PrunePlan {
  const plan: PrunePlan = {
    deletions: [],
    clear: [],
    objects: {},
    problems: [],
  }
  const served = new Set(
    rows.flatMap((r) => [r.storage_path, r.thumb_path].filter(Boolean)),
  )
  for (const row of rows) {
    const original = row.original_path
    if (!original) continue
    const source = rowToSource(row, backup, publicUrl)
    const planned = plannedPaths(job, source)
    const full = planned.find(({ variant }) => variant.name !== THUMB)!
    const thumb = planned.find(({ variant }) => variant.name === THUMB)!
    const problems: string[] = []
    if (row.storage_path !== full.path || row.thumb_path !== thumb.path)
      problems.push(`doesn't point at its WebPs (${row.storage_path})`)
    for (const { path, variant } of planned)
      if (!isDone(manifest, path, source, variant))
        problems.push(`${path} isn't in the manifest from this original`)
    const sha256 = backup.get(original)
    if (!sha256) problems.push(`original ${original} isn't in the local backup`)
    if (served.has(original))
      problems.push(`original ${original} is still served by a row`)
    if (problems.length) {
      plan.problems.push(`${row.id}: ${problems.join('; ')}`)
      continue
    }
    for (const { path } of planned) plan.objects[path] = manifest.objects[path]
    plan.deletions.push({ id: row.id, path: original, sha256: sha256! })
    plan.clear.push({
      id: row.id,
      expected_storage_path: row.storage_path,
      storage_path: row.storage_path,
      thumb_path: row.thumb_path ?? null,
      width: row.width ?? null,
      height: row.height ?? null,
      original_path: null,
    })
  }
  return plan
}
