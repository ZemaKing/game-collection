// `npm run db:export` (ROADMAP Phase 32) — a data export of every app table to git-ignored
// backups/db/<timestamp>/<table>.json, plus manifest.json (row counts + sha256 per file).
// Free-plan projects get no dashboard backups, and pg_dump isn't installed here, so this is the
// always-available copy of the data. The schema lives in supabase/migrations/. Restore steps:
// docs/backup.md. Service role, read-only; the whole database is ~1 MB of JSON.
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { adminClient, fetchAll } from './lib/supabaseAdmin.mjs'
import { formatBytes } from './lib/imageMeta.mjs'

// Parents before children, so restoring in this order satisfies the foreign keys and the
// item-reference triggers. [table, primary key to page by]
const TABLES = [
  ['platforms', 'id'],
  ['genres', 'id'],
  ['tags', 'id'],
  ['games', 'id'],
  ['special_editions', 'id'],
  ['steelbooks', 'id'],
  ['artbooks', 'id'],
  ['figures', 'id'],
  ['stuff', 'id'],
  ['dlcs', 'id'],
  ['game_genres', ['game_id', 'genre_id']],
  ['item_tags', ['item_type', 'item_id', 'tag_id']],
  ['item_images', 'id'],
  ['item_relationships', 'id'],
  ['admin_users', 'user_id'],
]

const client = adminClient()
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
const dir = path.join('backups', 'db', stamp)
await mkdir(dir, { recursive: true })

const files = []
for (const [table, orderBy] of TABLES) {
  const rows = await fetchAll(client, table, '*', orderBy)
  const json = JSON.stringify(rows, null, 2)
  await writeFile(path.join(dir, `${table}.json`), json)
  files.push({
    table,
    rows: rows.length,
    bytes: Buffer.byteLength(json),
    sha256: createHash('sha256').update(json).digest('hex'),
  })
  console.log(`  ${table.padEnd(20)} ${String(rows.length).padStart(6)} rows`)
}

await writeFile(
  path.join(dir, 'manifest.json'),
  JSON.stringify(
    {
      project: new URL(process.env.VITE_SUPABASE_URL).hostname,
      exportedAt: new Date().toISOString(),
      schema: 'supabase/migrations/ (baseline 20260915120000 + later files)',
      files,
    },
    null,
    2,
  ),
)
console.log(
  `\n✓ Exported ${files.length} tables (${formatBytes(files.reduce((s, f) => s + f.bytes, 0))}) to ${dir}`,
)
