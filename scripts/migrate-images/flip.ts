// `npm run images:flip` (ROADMAP Phase 34) — points item_images at the uploaded WebPs, only after checks.
//
//   npm run images:flip                          dry run: plan + HEAD every object + exact counts, rolled back
//   npm run images:flip -- --apply               the same, then flip all rows in ONE transaction
//   npm run images:flip -- --rollback [--apply]  storage_path ← original_path, variants cleared
//
// Before a flip every planned object answers HEAD 200 with the manifest's type and size (a full
// sha256 download of all of them would cost ~250 MB of egress; `npm run images:check -- --full`
// covers a sample instead). One failure blocks the whole flip. The originals stay in Storage —
// original_path is the rollback path until Phase 37. Needs VITE_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY (.env.local).
import { loadManifest } from '../images/manifest.ts'
import {
  createServiceClient,
  supabaseTarget,
} from '../images/supabase-target.ts'
import { verifyObjects } from '../images/verify.ts'
import job, { loadImageRows } from './job.ts'
import { planFlip, planRollback } from './plan.ts'

const args = new Set(process.argv.slice(2))
const unknown = [...args].filter((a) => !['--apply', '--rollback'].includes(a))
if (unknown.length) fail(`Unknown argument(s): ${unknown.join(' ')}`)
const apply = args.has('--apply')
const rollback = args.has('--rollback')

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

const supabase = createServiceClient()
const target = supabaseTarget(supabase, job.bucket)
const rows = await loadImageRows(supabase)
const manifest = loadManifest(job.manifest, job.name, job.bucket)
const plan = rollback
  ? planRollback(rows)
  : planFlip(job, rows, manifest, target.publicUrl)

console.log(
  `${rollback ? 'ROLLBACK to the originals' : 'FLIP to WebP'} — ${apply ? 'APPLYING' : 'DRY RUN (rolled back)'}`,
)
console.log(
  `  item_images rows ${rows.length} · to change ${plan.rows.length} · unchanged ${plan.unchanged} · problems ${plan.problems.length}`,
)
if (plan.problems.length) {
  for (const p of plan.problems.slice(0, 20)) console.log(`  ✖ ${p}`)
  if (plan.problems.length > 20)
    console.log(`  … +${plan.problems.length - 20} more`)
  fail(
    rollback
      ? "Some rows can't be rolled back — nothing was changed."
      : 'Not every image is uploaded — run `npm run images:migrate -- --apply` first. Nothing was changed.',
  )
}

if (!rollback) {
  const objects = Object.keys(plan.objects).length
  console.log(
    `\nChecking ${objects} Storage object(s) against the manifest (HEAD: status, type, size)…`,
  )
  const results = await verifyObjects(plan.objects, {
    mode: 'head',
    publicUrl: target.publicUrl,
    // ~2,800 HEADs draw the odd HTTP 429 from Storage: fewer at a time, and enough retries
    // (≈ 1 min of backoff) to outlast the rate-limit window
    retries: 8,
    concurrency: 3,
  })
  const failed = results.filter((r) => !r.ok)
  for (const r of failed.slice(0, 20))
    console.log(`  ✖ ${r.path}: ${r.problem}`)
  if (failed.length)
    fail(
      `${failed.length}/${objects} object(s) failed the check — nothing was changed.`,
    )
  console.log(`  ✓ ${objects}/${objects} objects OK`)
}

if (!plan.rows.length) {
  console.log('\nNothing to change.')
  process.exit(0)
}

const { data, error } = await supabase.rpc('set_item_image_variants', {
  p_rows: plan.rows,
  p_dry_run: !apply,
})
if (error)
  fail(
    `set_item_image_variants failed — the transaction was rolled back, nothing changed.\n  ${error.message}`,
  )

const result = data as {
  rows: number
  updated: number
  with_thumb: number
  with_original: number
  total: number
  dry_run: boolean
}
console.log(
  `\n${result.dry_run ? 'Dry run' : 'Done'}: updated ${result.updated}/${result.rows} · ` +
    `rows with a thumb ${result.with_thumb}/${result.total} · originals kept ${result.with_original}`,
)
if (result.dry_run)
  console.log(
    `Nothing was written. Re-run with --apply to ${rollback ? 'roll back' : 'flip'}.`,
  )
else console.log('Next: npm run images:verify')
