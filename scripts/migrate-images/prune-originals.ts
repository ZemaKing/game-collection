// `npm run images:prune-originals` (ROADMAP Phase 37) — deletes the pre-WebP originals from Storage.
//
//   npm run images:prune-originals             dry run: plan + every check, deletes nothing
//   npm run images:prune-originals -- --apply  the same checks, then delete in batches and clear
//                                              original_path (one transaction, at the end)
//   --limit=N                                  only the first N rows (a trial run)
//
// Checks, all before anything is deleted (any failure stops the run):
//   1. planPrune(): every row with an original serves the WebPs made from it, and every original
//      is in the backup manifest;
//   2. every original's local backup file (backups/images/) re-hashes to its recorded sha256;
//   3. every WebP those rows serve answers HEAD with the manifest's type and size.
// Every deleted path is appended to prune-log.json (committed as the record). Re-runs resume: an
// original that is already gone is simply cleared. Restoring needs the backup — see
// docs/backup.md. Needs VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local).
import { createHash } from 'node:crypto'
import {
  createReadStream,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

import { mapPool } from '../images/batch.ts'
import { loadManifest } from '../images/manifest.ts'
import {
  createServiceClient,
  supabaseTarget,
} from '../images/supabase-target.ts'
import { verifyObjects } from '../images/verify.ts'
import { formatBytes, localPathFor } from '../lib/imageMeta.mjs'
import job, { BACKUP_ROOT, loadBackupIndex, loadImageRows } from './job.ts'
import { type Deletion, planPrune } from './prune.ts'

const BATCH = 100
const LOG = new URL('./prune-log.json', import.meta.url)

const args = process.argv.slice(2)
const unknown = args.filter((a) => a !== '--apply' && !a.startsWith('--limit='))
if (unknown.length) fail(`Unknown argument(s): ${unknown.join(' ')}`)
const apply = args.includes('--apply')
const limitArg = args.find((a) => a.startsWith('--limit='))?.split('=')[1]
const limit = limitArg === undefined ? Infinity : Number(limitArg)
if (!(limit > 0)) fail('--limit needs a positive number.')

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

const sha256File = (file: string) =>
  new Promise<string>((done, reject) => {
    const hash = createHash('sha256')
    createReadStream(file)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => done(hash.digest('hex')))
      .on('error', reject)
  })

const supabase = createServiceClient()
const target = supabaseTarget(supabase, job.bucket)
const rows = await loadImageRows(supabase)
const manifest = loadManifest(job.manifest, job.name, job.bucket)
const backup = loadBackupIndex()
const backupBytes = new Map(
  (
    JSON.parse(readFileSync(resolve(BACKUP_ROOT, 'manifest.json'), 'utf8')) as {
      files: { path: string; bytes: number }[]
    }
  ).files.map((f) => [f.path, f.bytes]),
)
const full = planPrune(job, rows, manifest, backup, target.publicUrl)
const plan = {
  ...full,
  deletions: full.deletions.slice(0, limit),
  clear: full.clear.slice(0, limit),
}
plan.objects = Object.fromEntries(
  Object.entries(full.objects).filter(([path]) =>
    plan.clear.some((r) => r.storage_path === path || r.thumb_path === path),
  ),
)
const bytes = plan.deletions.reduce(
  (sum, d) => sum + (backupBytes.get(d.path) ?? 0),
  0,
)

console.log(
  `PRUNE ORIGINALS — ${apply ? 'APPLYING' : 'DRY RUN (nothing is deleted)'}`,
)
console.log(
  `  item_images rows ${rows.length} · originals to delete ${plan.deletions.length} (${formatBytes(bytes)}) · problems ${plan.problems.length}`,
)
if (plan.problems.length) {
  for (const p of plan.problems.slice(0, 20)) console.log(`  ✖ ${p}`)
  if (plan.problems.length > 20)
    console.log(`  … +${plan.problems.length - 20} more`)
  fail('Nothing was deleted.')
}
if (!plan.deletions.length) {
  console.log('\nNo originals left to delete.')
  process.exit(0)
}

console.log(
  `\n1. Re-hashing ${plan.deletions.length} local backup file(s) in ${BACKUP_ROOT}…`,
)
const badLocal: string[] = []
await mapPool(plan.deletions, 8, async (d) => {
  const file = localPathFor(BACKUP_ROOT, d.path)
  if (!existsSync(file)) badLocal.push(`${d.path}: missing locally`)
  else if ((await sha256File(file)) !== d.sha256)
    badLocal.push(`${d.path}: sha256 differs from the backup manifest`)
})
for (const b of badLocal.slice(0, 20)) console.log(`  ✖ ${b}`)
if (badLocal.length)
  fail(
    `${badLocal.length} original(s) aren't safely backed up — nothing was deleted.`,
  )
console.log(`  ✓ ${plan.deletions.length}/${plan.deletions.length} match`)

const objects = Object.keys(plan.objects).length
console.log(
  `\n2. Checking the ${objects} WebP object(s) those rows serve (HEAD)…`,
)
const results = await verifyObjects(plan.objects, {
  mode: 'head',
  publicUrl: target.publicUrl,
  retries: 8, // Storage answers the odd HTTP 429 on a few thousand HEADs
  concurrency: 3,
})
const failed = results.filter((r) => !r.ok)
for (const r of failed.slice(0, 20)) console.log(`  ✖ ${r.path}: ${r.problem}`)
if (failed.length)
  fail(
    `${failed.length}/${objects} WebP object(s) failed — nothing was deleted.`,
  )
console.log(`  ✓ ${objects}/${objects} OK`)

if (!apply) {
  const { error } = await supabase.rpc('set_item_image_variants', {
    p_rows: plan.clear,
    p_dry_run: true,
  })
  if (error) fail(`Clearing original_path would fail: ${error.message}`)
  console.log(
    `\nDry run: would delete ${plan.deletions.length} originals (${formatBytes(bytes)}) and clear original_path on ${plan.clear.length} rows.`,
  )
  console.log('Nothing was deleted. Re-run with --apply to delete.')
  process.exit(0)
}

type LogEntry = Deletion & { bytes: number; deletedAt: string; result: string }
const log: LogEntry[] = existsSync(LOG)
  ? (JSON.parse(readFileSync(LOG, 'utf8')) as LogEntry[])
  : []
const saveLog = () => writeFileSync(LOG, `${JSON.stringify(log, null, 2)}\n`)

console.log(`\n3. Deleting in batches of ${BATCH}…`)
let removed = 0
for (let i = 0; i < plan.deletions.length; i += BATCH) {
  const batch = plan.deletions.slice(i, i + BATCH)
  const { data, error } = await supabase.storage
    .from(job.bucket)
    .remove(batch.map((d) => d.path))
  if (error)
    fail(
      `Deleting batch ${i / BATCH + 1} failed: ${error.message}. Earlier batches are in prune-log.json; re-run to resume.`,
    )
  const gone = new Set((data ?? []).map((o) => o.name))
  const deletedAt = new Date().toISOString()
  for (const d of batch)
    log.push({
      ...d,
      bytes: backupBytes.get(d.path) ?? 0,
      deletedAt,
      result: gone.has(d.path) ? 'deleted' : 'already gone',
    })
  removed += gone.size
  saveLog()
  console.log(
    `  ${Math.min(i + BATCH, plan.deletions.length)}/${plan.deletions.length}`,
  )
}

console.log('\n4. Clearing original_path (one transaction)…')
const { data, error } = await supabase.rpc('set_item_image_variants', {
  p_rows: plan.clear,
  p_dry_run: false,
})
if (error)
  fail(
    `set_item_image_variants failed: ${error.message}. The originals are deleted (prune-log.json); re-run to clear original_path.`,
  )
const result = data as { updated: number; with_original: number }
console.log(
  `\nDone: deleted ${removed} originals (${formatBytes(bytes)}), ${plan.deletions.length - removed} were already gone; cleared original_path on ${result.updated} rows (${result.with_original} still have one).`,
)
console.log('Next: npm run images:verify && npm run images:audit')
