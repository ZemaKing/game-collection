// `npm run images:audit` (ROADMAP Phase 32) — what is in the item-images bucket and how it
// matches the item_images rows. Read-only, service role, metadata only (no downloads), so it costs
// almost no egress. Prints a summary and writes docs/images-audit.md.
import { mkdir, writeFile } from 'node:fs/promises'
import { adminClient, fetchAll, listAllObjects } from './lib/supabaseAdmin.mjs'
import { analyzeImages, renderAuditMarkdown } from './lib/imageAudit.mjs'
import { formatBytes } from './lib/imageMeta.mjs'

const client = adminClient()

console.log('Reading item_images, all_items and the bucket listing…')
const [rows, items, objects] = await Promise.all([
  fetchAll(
    client,
    'item_images',
    'id, item_type, item_id, storage_path, is_cover',
  ),
  fetchAll(client, 'all_items', 'id, item_type'),
  listAllObjects(client),
])

const audit = analyzeImages({ rows, objects, items })
const t = audit.totals
console.log(
  `\n${t.items} items · ${t.rows} image rows · ${t.objects} objects · ${formatBytes(t.bytes)}`,
)
for (const [format, e] of audit.byFormat) {
  console.log(
    `  ${format.padEnd(6)} ${String(e.count).padStart(5)}  ${formatBytes(e.bytes).padStart(9)}  avg ${formatBytes(e.bytes / e.count)}`,
  )
}
console.log(
  `Rows without object: ${audit.rowsWithoutObject.length} · objects without row: ${audit.objectsWithoutRow.length} · ` +
    `duplicate content: ${audit.duplicateContent.length} · path mismatches: ${audit.pathMismatches.length}`,
)

await mkdir('docs', { recursive: true })
await writeFile(
  'docs/images-audit.md',
  renderAuditMarkdown(
    audit,
    new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
  ),
)
console.log('\nWrote docs/images-audit.md')
