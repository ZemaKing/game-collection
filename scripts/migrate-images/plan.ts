// Pure planning for the Phase 34 flip (item_images → WebP variants) and its rollback. Unit-tested.
// The plan is the payload for public.set_item_image_variants(), which applies it in one
// transaction and refuses any row whose storage_path is no longer `expected_storage_path`.
import { plannedPaths } from '../images/batch.ts'
import {
  isDone,
  type Manifest,
  type ManifestEntry,
} from '../images/manifest.ts'
import type { ImageJob } from '../images/types.ts'
import { type ImageRow, needsMigration, rowToSource } from './job.ts'

export type FlipRow = {
  id: string
  expected_storage_path: string
  storage_path: string
  thumb_path: string | null
  width: number | null
  height: number | null
  original_path: string | null
}

export type FlipPlan = {
  rows: FlipRow[] // payload for set_item_image_variants()
  objects: Record<string, ManifestEntry> // what must verify before flipping
  problems: string[] // any problem blocks the whole flip
  unchanged: number // rows already in the planned state (or with nothing to do)
}

const THUMB = 'thumb'

// Flip every row that has an original to its uploaded WebPs. A row is only ready when both
// variants are in the manifest, made from that row's original with the job's current settings —
// otherwise the flip is blocked (all rows or none). Rows born WebP (Phase 36) are left alone.
export function planFlip(
  job: ImageJob,
  rows: ImageRow[],
  manifest: Manifest,
  publicUrl: (path: string) => string,
): FlipPlan {
  const plan: FlipPlan = { rows: [], objects: {}, problems: [], unchanged: 0 }
  for (const row of rows) {
    if (!needsMigration(row)) {
      plan.unchanged++
      continue
    }
    const source = rowToSource(row, new Map(), publicUrl)
    const planned = plannedPaths(job, source)
    const missing = planned.filter(
      ({ path, variant }) => !isDone(manifest, path, source, variant),
    )
    if (missing.length) {
      const why = missing.map(({ path }) =>
        manifest.objects[path]
          ? `${path} was made from another original or with other settings`
          : `${path} not uploaded`,
      )
      plan.problems.push(`${row.id}: ${why.join('; ')}`)
      continue
    }
    const full = planned.find(({ variant }) => variant.name !== THUMB)!
    const thumb = planned.find(({ variant }) => variant.name === THUMB)!
    for (const { path } of planned) plan.objects[path] = manifest.objects[path]
    if (row.original_path) {
      if (row.storage_path === full.path && row.thumb_path === thumb.path) {
        plan.unchanged++
      } else {
        plan.problems.push(
          `${row.id}: has original_path but storage_path ${row.storage_path} isn't its WebP — check it by hand`,
        )
      }
      continue
    }
    const fullEntry = manifest.objects[full.path]
    plan.rows.push({
      id: row.id,
      expected_storage_path: row.storage_path,
      storage_path: full.path,
      thumb_path: thumb.path,
      width: fullEntry.width,
      height: fullEntry.height,
      original_path: row.storage_path,
    })
  }
  return plan
}

// Back to the originals: only rows the flip changed (original_path set). Rows born WebP have no
// original and stay as they are. The WebP objects are left in Storage, so flipping again is cheap.
export function planRollback(rows: ImageRow[]): FlipPlan {
  const plan: FlipPlan = { rows: [], objects: {}, problems: [], unchanged: 0 }
  for (const row of rows) {
    if (!row.original_path) {
      plan.unchanged++
      continue
    }
    plan.rows.push({
      id: row.id,
      expected_storage_path: row.storage_path,
      storage_path: row.original_path,
      thumb_path: null,
      width: null,
      height: null,
      original_path: null,
    })
  }
  return plan
}
