// `npm run images:verify` (ROADMAP Phase 34) — what the app loads, against the live database:
//
//   every item_images row's storage_path, thumb_path and small_path answers HEAD 200 with image/webp
//   (a row still on its original is reported, not failed, so this also works before the flip);
//   `--originals` also HEADs every original_path — the rollback path until Phase 37;
//   `--sample=N` also downloads N random manifest objects and checks sha256 + dimensions.
//
// HEADs cost next to no egress; a sample of 50 is ~5 MB. Exit code 1 on any failure.
// Needs VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local).
import { mapPool } from '../images/batch.ts'
import { loadManifest } from '../images/manifest.ts'
import { errorMessage, HttpError, withRetry } from '../images/retry.ts'
import {
  createServiceClient,
  supabaseTarget,
} from '../images/supabase-target.ts'
import { verifyObjects } from '../images/verify.ts'
import job, { loadImageRows } from './job.ts'

const argv = process.argv.slice(2)
const originals = argv.includes('--originals')
const sample = Number(
  argv.find((a) => a.startsWith('--sample='))?.split('=')[1] ?? 0,
)
if (!(sample >= 0)) throw new Error('--sample needs a number.')

const supabase = createServiceClient()
const publicUrl = supabaseTarget(supabase, job.bucket).publicUrl
const rows = await loadImageRows(supabase)

type Check = { what: string; path: string; webp: boolean }
const failures: string[] = []

async function head({ what, path, webp }: Check): Promise<void> {
  const url = publicUrl(path)
  try {
    await withRetry(
      async () => {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(30_000),
        })
        if (!response.ok)
          throw new HttpError(response.status, `HTTP ${response.status}`)
        const type = response.headers.get('content-type') ?? ''
        // The browser's PNG fallback (Phase 36) is the one non-WebP variant
        const expected = path.endsWith('.png') ? 'image/png' : 'image/webp'
        const ok = webp ? type === expected : type.startsWith('image/')
        if (!ok) throw new HttpError(415, `content-type ${type || 'missing'}`)
      },
      { retries: 8 },
    )
  } catch (error) {
    failures.push(`${what}: ${errorMessage(error)} — ${path}`)
  }
}

const checks: Check[] = []
let onWebp = 0
let withSmall = 0
for (const row of rows) {
  if (row.thumb_path) {
    onWebp++
    checks.push({ what: `${row.id} full`, path: row.storage_path, webp: true })
    checks.push({ what: `${row.id} thumb`, path: row.thumb_path, webp: true })
    if (row.small_path) {
      withSmall++
      checks.push({ what: `${row.id} small`, path: row.small_path, webp: true })
    }
  } else {
    checks.push({
      what: `${row.id} original (not flipped)`,
      path: row.storage_path,
      webp: false,
    })
  }
  if (originals && row.original_path)
    checks.push({
      what: `${row.id} original_path`,
      path: row.original_path,
      webp: false,
    })
}

console.log(
  `item_images: ${rows.length} rows · ${onWebp} on WebP (full + thumb) · ${withSmall} with small · ${rows.length - onWebp} still on the original`,
)
await mapPool(checks, 3, head) // more at a time draws HTTP 429s from Storage
console.log(
  `HEAD ${checks.length} URLs${originals ? ' (incl. original_path)' : ''} → ${failures.length ? `${failures.length} failed` : 'all 200'}`,
)

if (sample) {
  const manifest = loadManifest(job.manifest, job.name, job.bucket)
  const picked = Object.keys(manifest.objects)
    .sort(() => Math.random() - 0.5)
    .slice(0, sample)
  const results = await verifyObjects(
    Object.fromEntries(picked.map((p) => [p, manifest.objects[p]])),
    { mode: 'full', publicUrl, retries: 8, concurrency: 3 },
  )
  for (const r of results.filter((r) => !r.ok))
    failures.push(`${r.path}: ${r.problem}`)
  console.log(
    `Sample: ${picked.length} manifest objects downloaded → ${results.filter((r) => r.ok).length} match (sha256, bytes, dimensions)`,
  )
}

for (const f of failures.slice(0, 30)) console.log(`  ✖ ${f}`)
if (failures.length > 30) console.log(`  … +${failures.length - 30} more`)
console.log(
  `\n${failures.length ? `✖ ${failures.length} problem(s)` : '✓ All checks passed'}` +
    (onWebp === rows.length
      ? ' · every image row serves WebP'
      : ` · ${rows.length - onWebp} row(s) not on WebP yet`),
)
process.exit(failures.length ? 1 : 0)
