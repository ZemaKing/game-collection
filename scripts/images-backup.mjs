// `npm run images:backup` (ROADMAP Phase 32) — one complete, checksummed local copy of every object
// in the item-images bucket, in git-ignored backups/images/<storage path>, plus
// backups/images/manifest.json (path, bytes, sha256, width, height, content type, and the
// item_images rows that use it — enough to restore the bucket and re-point rows).
//
//   npm run images:backup                      plan only: what is missing locally and how many
//                                              bytes a download would cost (egress) — downloads nothing
//   npm run images:backup -- --apply           download what is missing (resumes; re-runs download 0 bytes)
//   npm run images:backup -- --apply --limit=20   try it on a few files first
//   npm run images:backup -- --verify          re-hash every local file against the manifest (offline)
//   npm run images:backup -- --verify --root=E:/backups/images   …or check the second copy
//
// Service role, read-only on Supabase. The egress budget (ROADMAP workflow rule 7) is shared with
// the recipes app, so the plan is always printed first and --apply is required to download.
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  adminClient,
  BUCKET,
  fetchAll,
  listAllObjects,
  withRetry,
} from './lib/supabaseAdmin.mjs'
import { formatBytes, imageSize, localPathFor } from './lib/imageMeta.mjs'

const args = process.argv.slice(2)
const ROOT =
  args.find((a) => a.startsWith('--root='))?.slice('--root='.length) ??
  path.join('backups', 'images')
const MANIFEST = path.join(ROOT, 'manifest.json')
const CONCURRENCY = 4
const SAVE_EVERY = 25

const apply = args.includes('--apply')
const verifyOnly = args.includes('--verify')
const limit = Number(
  args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? Infinity,
)

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

async function loadManifest() {
  try {
    const parsed = JSON.parse(await readFile(MANIFEST, 'utf8'))
    return new Map(parsed.files.map((f) => [f.path, f]))
  } catch (error) {
    if (error.code === 'ENOENT') return new Map()
    throw error
  }
}

async function saveManifest(entries, extra = {}) {
  const files = [...entries.values()].sort((a, b) =>
    a.path.localeCompare(b.path),
  )
  const body = {
    bucket: BUCKET,
    project: new URL(process.env.VITE_SUPABASE_URL).hostname,
    updatedAt: new Date().toISOString(),
    fileCount: files.length,
    totalBytes: files.reduce((sum, f) => sum + f.bytes, 0),
    ...extra,
    files,
  }
  await mkdir(ROOT, { recursive: true })
  await writeFile(`${MANIFEST}.tmp`, JSON.stringify(body, null, 2))
  await rename(`${MANIFEST}.tmp`, MANIFEST)
}

async function localSize(file) {
  try {
    return (await stat(file)).size
  } catch {
    return -1
  }
}

const rowsFor = (object, rowsByPath) =>
  (rowsByPath.get(object.path) ?? []).map(
    ({ id, item_type, item_id, position, is_cover, alt_text }) => ({
      id,
      item_type,
      item_id,
      position,
      is_cover,
      alt_text,
    }),
  )

function entryFor(object, bytes, rowsByPath) {
  const size = imageSize(bytes)
  return {
    path: object.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    width: size?.width ?? null,
    height: size?.height ?? null,
    format: size?.format ?? null,
    contentType: object.mimetype,
    eTag: object.eTag,
    lastModified: object.lastModified,
    rows: rowsFor(object, rowsByPath),
  }
}

// ---------------------------------------------------------------------
// --verify: offline re-hash
// ---------------------------------------------------------------------

if (verifyOnly) {
  const manifest = await loadManifest()
  if (manifest.size === 0) {
    console.error(`✖ No manifest at ${MANIFEST}.`)
    process.exit(1)
  }
  let ok = 0
  const problems = []
  for (const entry of manifest.values()) {
    const file = localPathFor(ROOT, entry.path)
    try {
      const bytes = await readFile(file)
      if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256)
        problems.push(`changed: ${entry.path}`)
      else ok += 1
    } catch {
      problems.push(`missing: ${entry.path}`)
    }
  }
  for (const p of problems.slice(0, 50)) console.log(`✖ ${p}`)
  console.log(
    `\n${ok}/${manifest.size} files match their sha256${problems.length ? `, ${problems.length} problem(s)` : ''}.`,
  )
  process.exit(problems.length ? 1 : 0)
}

// ---------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------

const client = adminClient()
console.log('Reading the bucket listing and item_images…')
const [objects, rows] = await Promise.all([
  listAllObjects(client),
  fetchAll(
    client,
    'item_images',
    'id, item_type, item_id, storage_path, position, is_cover, alt_text',
  ),
])
const rowsByPath = new Map()
for (const r of rows)
  rowsByPath.set(r.storage_path, [...(rowsByPath.get(r.storage_path) ?? []), r])

const manifest = await loadManifest()
const toDownload = []
let adopted = 0
for (const object of objects) {
  const file = localPathFor(ROOT, object.path)
  const onDisk = await localSize(file)
  const known = manifest.get(object.path)
  if (onDisk === object.size && known?.bytes === object.size && known.sha256) {
    known.rows = rowsFor(object, rowsByPath) // refresh the row links only
    continue
  }
  if (onDisk === object.size) {
    // On disk from an interrupted run but not in the manifest yet: hash it instead of re-downloading.
    manifest.set(
      object.path,
      entryFor(object, await readFile(file), rowsByPath),
    )
    adopted += 1
    continue
  }
  toDownload.push(object)
}
const remoteBytes = objects.reduce((sum, o) => sum + o.size, 0)
const pending = toDownload.slice(0, limit)
const pendingBytes = pending.reduce((sum, o) => sum + o.size, 0)
const remotePaths = new Set(objects.map((o) => o.path))
const gone = [...manifest.keys()].filter((p) => !remotePaths.has(p))

console.log(`\nBucket: ${objects.length} objects, ${formatBytes(remoteBytes)}`)
console.log(
  `Local:  ${objects.length - toDownload.length} already backed up${adopted ? ` (${adopted} hashed from disk)` : ''}`,
)
console.log(
  `To download: ${toDownload.length} files, ${formatBytes(toDownload.reduce((s, o) => s + o.size, 0))}`,
)
if (pending.length !== toDownload.length)
  console.log(
    `This run (--limit=${limit}): ${pending.length} files, ${formatBytes(pendingBytes)}`,
  )
if (gone.length)
  console.log(
    `Note: ${gone.length} backed-up file(s) are no longer in the bucket — kept locally, still in the manifest.`,
  )

if (!apply || pending.length === 0) {
  if (adopted) await saveManifest(manifest)
  if (pending.length && !apply) {
    console.log(
      `\nDry run. This would use ≈ ${formatBytes(pendingBytes)} of the month's egress. Re-run with --apply to download.`,
    )
  } else {
    await saveManifest(manifest, { complete: toDownload.length === 0 })
    console.log(
      toDownload.length === 0
        ? '\n✓ Backup is complete — nothing to download.'
        : '',
    )
  }
  process.exit(0)
}

// ---------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------

let done = 0
let downloaded = 0
const failures = []
const queue = [...pending]

async function worker() {
  for (let object = queue.shift(); object; object = queue.shift()) {
    try {
      const data = await withRetry(object.path, () =>
        client.storage.from(BUCKET).download(object.path),
      )
      const bytes = Buffer.from(await data.arrayBuffer())
      if (bytes.length !== object.size)
        throw new Error(`size ${bytes.length} ≠ listed ${object.size}`)
      const file = localPathFor(ROOT, object.path)
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(`${file}.part`, bytes)
      await rename(`${file}.part`, file)
      manifest.set(object.path, entryFor(object, bytes, rowsByPath))
      downloaded += bytes.length
    } catch (error) {
      failures.push(`${object.path}: ${error.message}`)
    }
    done += 1
    if (done % SAVE_EVERY === 0) {
      await saveManifest(manifest)
      process.stdout.write(
        `  ${done}/${pending.length} · ${formatBytes(downloaded)}\n`,
      )
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))
const complete = failures.length === 0 && pending.length === toDownload.length
await saveManifest(manifest, { complete })

for (const f of failures) console.log(`✖ ${f}`)
console.log(
  `\nDownloaded ${pending.length - failures.length}/${pending.length} files, ${formatBytes(downloaded)}.`,
)
console.log(
  complete ? '✓ Backup is complete.' : 'Re-run to fetch the rest (it resumes).',
)
process.exit(failures.length ? 1 : 0)
