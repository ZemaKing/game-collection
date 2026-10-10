// `npm run images:small-flip` (ROADMAP Phase 39, gap 3) — writes item_images.small_path for every
// row whose small image is uploaded (`npm run images:small -- --apply`), after checks.
//
//   npm run images:small-flip            dry run: plan + HEAD every small object + exact counts
//   npm run images:small-flip -- --apply the same, then write small_path in ONE transaction
//
// Undo: set small_path back to null in the SQL editor — the app then loads the thumb alone.
// Needs VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local) and migration 20261013120000.
import { loadManifest } from '../images/manifest.ts'
import {
  createServiceClient,
  supabaseTarget,
} from '../images/supabase-target.ts'
import { verifyObjects } from '../images/verify.ts'
import { loadBackupIndex, loadImageRows } from './job.ts'
import smallJob, {
  loadPrunedOriginals,
  planSmall,
  type SmallRow,
  smallSource,
} from './small-job.ts'

const args = new Set(process.argv.slice(2))
const unknown = [...args].filter((a) => a !== '--apply')
if (unknown.length) fail(`Unknown argument(s): ${unknown.join(' ')}`)
const apply = args.has('--apply')

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

const supabase = createServiceClient()
const target = supabaseTarget(supabase, smallJob.bucket)
const rows = (await loadImageRows(supabase)) as SmallRow[]
if (rows.length && !('small_path' in rows[0]))
  fail(
    'item_images has no small_path yet — apply migration 20261013120000 first.',
  )
const manifest = loadManifest(smallJob.manifest, smallJob.name, smallJob.bucket)
const pruned = loadPrunedOriginals()
const backup = loadBackupIndex()
const plan = planSmall(smallJob, rows, manifest, (row) =>
  smallSource(row, pruned, backup, target.publicUrl),
)

console.log(`SMALL VARIANT — ${apply ? 'APPLYING' : 'DRY RUN (rolled back)'}`)
console.log(
  `  item_images rows ${rows.length} · to set ${plan.rows.length} · already set ${plan.unchanged} · not uploaded ${plan.missing.length}`,
)
if (plan.missing.length)
  console.log(
    `  (rows not uploaded keep their thumb; run \`npm run images:small -- --apply\` for them, e.g. ${plan.missing.slice(0, 3).join(', ')})`,
  )
if (!plan.rows.length) {
  console.log('\nNothing to change.')
  process.exit(0)
}

const objects = Object.keys(plan.objects).length
console.log(
  `\nChecking ${objects} small object(s) against the manifest (HEAD)…`,
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
  fail(`${failed.length}/${objects} object(s) failed — nothing was changed.`)
console.log(`  ✓ ${objects}/${objects} OK`)

const { data, error } = await supabase.rpc('set_item_image_small', {
  p_rows: plan.rows,
  p_dry_run: !apply,
})
if (error)
  fail(
    `set_item_image_small failed — the transaction was rolled back, nothing changed.\n  ${error.message}`,
  )
const result = data as {
  rows: number
  updated: number
  with_small: number
  total: number
  dry_run: boolean
}
console.log(
  `\n${result.dry_run ? 'Dry run' : 'Done'}: updated ${result.updated}/${result.rows} · rows with a small image ${result.with_small}/${result.total}`,
)
if (result.dry_run) console.log('Nothing was written. Re-run with --apply.')
