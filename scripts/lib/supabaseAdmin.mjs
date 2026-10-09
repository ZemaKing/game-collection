// Service-role access for the maintenance scripts (Phase 32+). The key is read from .env.local
// (git-ignored) via `node --env-file-if-exists=.env.local` and never leaves this process.
// It bypasses RLS, so these scripts only ever READ unless a script says otherwise.
import { createClient } from '@supabase/supabase-js'

export const BUCKET = 'item-images'
const PAGE = 1000

export function adminClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    console.error(
      '✖ VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing (.env.local). Never prefix the key with VITE_.',
    )
    process.exit(1)
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Runs a Supabase call that resolves to `{ data, error }`, retrying transient failures (Storage
 * answers "Too many connections" under bursts) with exponential backoff. Returns `data`.
 */
export async function withRetry(label, call, attempts = 5) {
  for (let attempt = 1; ; attempt += 1) {
    let error
    try {
      const result = await call()
      if (!result.error) return result.data
      error = result.error
    } catch (thrown) {
      error = thrown
    }
    if (attempt >= attempts)
      throw new Error(`${label}: ${error.message ?? error}`)
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
  }
}

/**
 * Every row of a table, paged (PostgREST caps a response at 1000 rows). `orderBy` must be unique
 * (the primary key, all columns of a composite one) or pages can skip or repeat rows.
 * @param {string | string[]} orderBy
 */
export async function fetchAll(client, table, columns = '*', orderBy = 'id') {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    let query = client.from(table).select(columns)
    for (const column of [orderBy].flat()) query = query.order(column)
    const { data, error } = await query.range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...data)
    if (data.length < PAGE) return rows
  }
}

/**
 * Every object in the bucket, walked folder by folder with the Storage list API. Uses metadata
 * only (size, mimetype, eTag, cacheControl) — nothing is downloaded.
 * @returns {Promise<Array<{ path: string, size: number, mimetype: string, eTag: string, cacheControl: string, lastModified: string }>>}
 */
export async function listAllObjects(client, prefix = '') {
  const objects = []
  for (let offset = 0; ; offset += PAGE) {
    const data = await withRetry(`list ${prefix || '/'}`, () =>
      client.storage.from(BUCKET).list(prefix, {
        limit: PAGE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      }),
    )
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id === null) {
        objects.push(...(await listAllObjects(client, full))) // a folder
      } else if (entry.name !== '.emptyFolderPlaceholder') {
        const m = entry.metadata ?? {}
        objects.push({
          path: full,
          size: m.size ?? 0,
          mimetype: m.mimetype ?? '',
          eTag: m.eTag ?? '',
          cacheControl: m.cacheControl ?? '',
          lastModified: m.lastModified ?? entry.updated_at ?? '',
        })
      }
    }
    if (data.length < PAGE) return objects
  }
}
