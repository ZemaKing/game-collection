// `npm run verify:rls` — proves the Phase 31 lockdown (migration 20261009120000_admin_only_writes)
// against the live project, using only the PUBLIC anon key plus two real logins (never the
// service-role key):
//
//   RLS_ADMIN_EMAIL / RLS_ADMIN_PASSWORD  — the owner (row in public.admin_users)
//   RLS_USER_EMAIL  / RLS_USER_PASSWORD   — any other user, NOT in admin_users. Sign-ups are off,
//                                           so create it in Dashboard → Authentication → Add user.
//
// Put them in .env.local (git-ignored). It checks:
//   - /auth/v1/settings reports sign-ups disabled;
//   - anon and the non-admin user can read every table, but every INSERT is refused and every
//     UPDATE / DELETE touches 0 rows; admin_users is unreadable and unwritable for everyone;
//   - Storage (item-images): anon + non-admin can't upload, overwrite, delete or LIST; public URLs
//     still load; the admin can upload, list and delete;
//   - the admin can insert, update and delete on every table.
// The admin creates throw-away fixtures (titles "ZZ RLS …", slugs "zz-rls-…", Storage under
// zz-rls/), and everything is deleted again at the end — even after a failure.
import { createClient } from '@supabase/supabase-js'

const env = process.env
const url = env.VITE_SUPABASE_URL?.trim()
const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()
if (!url || !anonKey)
  fail('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing (.env.local).')

const missing = [
  'RLS_ADMIN_EMAIL',
  'RLS_ADMIN_PASSWORD',
  'RLS_USER_EMAIL',
  'RLS_USER_PASSWORD',
].filter((k) => !env[k])
if (missing.length)
  fail(
    `Missing ${missing.join(', ')} in .env.local — see the header of scripts/verify-rls.mjs.`,
  )

const client = () =>
  createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

const BUCKET = 'item-images'
const ITEM_TABLES = {
  game: 'games',
  special_edition: 'special_editions',
  steelbook: 'steelbooks',
  artbook: 'artbooks',
  figure: 'figures',
  stuff: 'stuff',
  dlc: 'dlcs',
}

const results = []
const check = (who, what, ok, detail = '') =>
  results.push({ who, what, ok, detail })

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

async function signIn(email, password, label) {
  const c = client()
  const { error } = await c.auth.signInWithPassword({ email, password })
  if (error) fail(`${label} could not sign in: ${error.message}`)
  return c
}

const suffix = Math.random().toString(36).slice(2, 8)
const title = (name) => `ZZ RLS ${name} ${suffix}`
const slug = (name) => `zz-rls-${name}-${suffix}`
const denied = (error) =>
  !!error &&
  (error.code === '42501' ||
    /permission denied|row-level security/i.test(error.message))

// ---------------------------------------------------------------------
// Fixtures (created by the admin)
// ---------------------------------------------------------------------

async function createFixtures(admin) {
  const one = async (table, row) => {
    const { data, error } = await admin
      .from(table)
      .insert(row)
      .select()
      .single()
    if (error)
      throw new Error(
        `admin insert into ${table} failed: ${error.message} (${error.code})`,
      )
    return data
  }
  const f = {}
  f.platform = await one('platforms', {
    name: title('Platform'),
    slug: slug('platform'),
  })
  f.genre = await one('genres', { name: title('Genre'), slug: slug('genre') })
  f.spareGenre = await one('genres', {
    name: title('Genre2'),
    slug: slug('genre2'),
  })
  f.tag = await one('tags', { name: title('Tag'), slug: slug('tag') })
  f.spareTag = await one('tags', { name: title('Tag2'), slug: slug('tag2') })
  f.game = await one('games', {
    title: title('Game'),
    platform_id: f.platform.id,
  })
  f.special_edition = await one('special_editions', {
    title: title('Special Edition'),
  })
  f.steelbook = await one('steelbooks', { title: title('Steelbook') })
  f.artbook = await one('artbooks', { title: title('Artbook') })
  f.figure = await one('figures', { title: title('Figure') })
  f.stuff = await one('stuff', { title: title('Stuff') })
  f.dlc = await one('dlcs', { title: title('DLC'), game_id: f.game.id })
  f.gameGenre = await one('game_genres', {
    game_id: f.game.id,
    genre_id: f.genre.id,
  })
  f.itemTag = await one('item_tags', {
    item_type: 'game',
    item_id: f.game.id,
    tag_id: f.tag.id,
  })
  f.image = await one('item_images', {
    item_type: 'game',
    item_id: f.game.id,
    storage_path: `zz-rls/${suffix}-row.webp`,
    position: 99,
  })
  f.relationship = await one('item_relationships', {
    parent_type: 'game',
    parent_id: f.game.id,
    child_type: 'special_edition',
    child_id: f.special_edition.id,
  })
  return f
}

// Per table: how to find the fixture row, a harmless UPDATE, and a row an outsider might INSERT
// that would be valid if they were allowed to (so a refusal proves RLS, not a constraint).
function tableCases(f) {
  const byId = (row) => ({ id: row.id })
  const items = Object.entries(ITEM_TABLES).map(([type, table]) => ({
    table,
    match: byId(f[type]),
    patch: { title: title('HACKED') }, // keeps the ZZ RLS marker for cleanup
    insert:
      type === 'dlc'
        ? { title: title('X dlc'), game_id: f.game.id }
        : { title: title(`X ${type}`) },
  }))
  return [
    ...items,
    ...['platforms', 'genres', 'tags'].map((table) => ({
      table,
      match: byId(
        f[{ platforms: 'platform', genres: 'genre', tags: 'tag' }[table]],
      ),
      patch: { name: 'HACKED' },
      insert: { name: title(`X ${table}`), slug: slug(`x-${table}`) },
    })),
    {
      table: 'game_genres',
      match: { game_id: f.game.id, genre_id: f.genre.id },
      patch: { position: 7 },
      insert: { game_id: f.game.id, genre_id: f.spareGenre.id },
    },
    {
      table: 'item_tags',
      match: { item_type: 'game', item_id: f.game.id, tag_id: f.tag.id },
      patch: { created_at: '2000-01-01T00:00:00Z' },
      insert: { item_type: 'game', item_id: f.game.id, tag_id: f.spareTag.id },
    },
    {
      table: 'item_images',
      match: byId(f.image),
      patch: { alt_text: 'HACKED' },
      insert: {
        item_type: 'game',
        item_id: f.game.id,
        storage_path: `zz-rls/${suffix}-x.webp`,
        position: 98,
      },
    },
    {
      table: 'item_relationships',
      match: byId(f.relationship),
      patch: { relationship_type: 'hacked' },
      insert: {
        parent_type: 'special_edition',
        parent_id: f.special_edition.id,
        child_type: 'game',
        child_id: f.game.id,
      },
    },
  ]
}

// ---------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------

async function checkSignupsDisabled() {
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: anonKey },
  })
  const settings = await response.json()
  check(
    'project',
    'sign-ups are disabled',
    settings.disable_signup === true,
    `disable_signup: ${settings.disable_signup}`,
  )
}

async function checkOutsider(who, c, f, uid) {
  const { data: isAdmin, error: rpcError } = await c.rpc('is_admin')
  check(
    who,
    'is_admin() is false',
    !rpcError && isAdmin === false,
    rpcError?.message ?? String(isAdmin),
  )

  for (const { table, match, patch, insert } of tableCases(f)) {
    const { data: read, error: readError } = await c
      .from(table)
      .select('*')
      .match(match)
    check(
      who,
      `reads ${table}`,
      !readError && read.length === 1,
      readError?.code ?? `${read.length} rows`,
    )

    const { error: insError } = await c.from(table).insert(insert)
    check(
      who,
      `INSERT into ${table} denied`,
      denied(insError),
      insError?.code ?? 'INSERT SUCCEEDED',
    )

    const { data: upd, error: updError } = await c
      .from(table)
      .update(patch)
      .match(match)
      .select()
    check(
      who,
      `UPDATE ${table} changes nothing`,
      !!updError || upd.length === 0,
      updError?.code ?? `${upd.length} rows`,
    )

    const { data: del, error: delError } = await c
      .from(table)
      .delete()
      .match(match)
      .select()
    check(
      who,
      `DELETE ${table} removes nothing`,
      !!delError || del.length === 0,
      delError?.code ?? `${del.length} rows`,
    )
  }

  const { data: rows, error: readError } = await c
    .from('admin_users')
    .select('*')
  check(
    who,
    'cannot read admin_users',
    !!readError || rows.length === 0,
    readError?.code ?? `${rows.length} rows`,
  )
  const { error: insError } = await c
    .from('admin_users')
    .insert({ user_id: uid })
  check(
    who,
    'cannot add itself to admin_users',
    denied(insError),
    insError?.code ?? 'INSERT SUCCEEDED',
  )
}

async function checkAdminWrites(admin, f) {
  const { data: isAdmin, error } = await admin.rpc('is_admin')
  check(
    'admin',
    'is_admin() is true',
    !error && isAdmin === true,
    error?.message ?? String(isAdmin),
  )

  // INSERT already proven by createFixtures on every table.
  for (const { table, match, patch } of tableCases(f)) {
    const { data, error: updError } = await admin
      .from(table)
      .update(patch)
      .match(match)
      .select()
    check(
      'admin',
      `UPDATE ${table} works`,
      !updError && data.length === 1,
      updError?.message ?? `${data.length} rows`,
    )
  }

  const uid = (await admin.auth.getUser()).data.user.id
  const { error: insError } = await admin
    .from('admin_users')
    .insert({ user_id: uid })
  check(
    'admin',
    'cannot write admin_users via the API (SQL editor only)',
    denied(insError),
    insError?.code ?? 'INSERT SUCCEEDED',
  )
}

// DELETE as the admin, children first, each must remove exactly its fixture row.
async function checkAdminDeletes(admin, f) {
  const order = [
    'item_relationships',
    'item_images',
    'item_tags',
    'game_genres',
    'dlcs',
    'games',
    'special_editions',
    'steelbooks',
    'artbooks',
    'figures',
    'stuff',
    'platforms',
    'genres',
    'tags',
  ]
  const cases = Object.fromEntries(tableCases(f).map((c) => [c.table, c]))
  for (const table of order) {
    const { data, error } = await admin
      .from(table)
      .delete()
      .match(cases[table].match)
      .select()
    check(
      'admin',
      `DELETE ${table} works`,
      !error && data.length === 1,
      error?.message ?? `${data.length} rows`,
    )
  }
}

async function checkStorage(anon, user, admin) {
  const objectPath = `zz-rls/${suffix}.webp`
  const webp = () =>
    new Blob([new Uint8Array([82, 73, 70, 70])], { type: 'image/webp' })

  for (const [who, c] of [
    ['anon', anon],
    ['user', user],
  ]) {
    const { error } = await c.storage
      .from(BUCKET)
      .upload(`zz-rls/${who}-${suffix}.webp`, webp(), {
        contentType: 'image/webp',
      })
    check(
      who,
      'storage upload denied',
      !!error,
      error?.message ?? 'UPLOAD SUCCEEDED',
    )
  }

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(objectPath, webp(), { contentType: 'image/webp' })
  check('admin', 'storage upload works', !upErr, upErr?.message ?? '')
  const { error: typeErr } = await admin.storage
    .from(BUCKET)
    .upload(`zz-rls/${suffix}.txt`, new Blob(['x']), {
      contentType: 'text/plain',
    })
  check(
    'admin',
    'storage rejects non-image types',
    !!typeErr,
    typeErr?.message ?? 'UPLOAD SUCCEEDED',
  )

  const publicUrl = admin.storage.from(BUCKET).getPublicUrl(objectPath)
    .data.publicUrl
  const response = await fetch(publicUrl)
  check(
    'anon',
    'reads the object via its public URL',
    response.status === 200,
    `HTTP ${response.status}`,
  )

  for (const [who, c] of [
    ['anon', anon],
    ['user', user],
  ]) {
    const { data: listed } = await c.storage.from(BUCKET).list('zz-rls')
    check(
      who,
      'cannot list the test folder',
      !listed?.length,
      `${listed?.length} listed`,
    )
    const { data: real } = await c.storage
      .from(BUCKET)
      .list('game', { limit: 1 })
    check(
      who,
      'cannot list the real images',
      !real?.length,
      `${real?.length} listed`,
    )
    const { data: removed } = await c.storage.from(BUCKET).remove([objectPath])
    check(
      who,
      'storage delete removes nothing',
      !removed?.length,
      `${removed?.length} removed`,
    )
    const { error: overwrite } = await c.storage
      .from(BUCKET)
      .upload(objectPath, webp(), { contentType: 'image/webp', upsert: true })
    check(
      who,
      'storage overwrite denied',
      !!overwrite,
      overwrite?.message ?? 'OVERWRITE SUCCEEDED',
    )
  }

  const { data: listed } = await admin.storage.from(BUCKET).list('zz-rls')
  check(
    'admin',
    'lists the bucket',
    !!listed?.some((o) => objectPath.endsWith(o.name)),
  )
  const { data: removed, error: rmErr } = await admin.storage
    .from(BUCKET)
    .remove([objectPath])
  check(
    'admin',
    'storage delete works',
    !rmErr && removed?.length === 1,
    rmErr?.message ?? `${removed?.length} removed`,
  )
  // Not via the public URL: the CDN keeps serving the copy fetched above for up to an hour.
  const { data: after } = await admin.storage.from(BUCKET).list('zz-rls')
  check(
    'admin',
    'deleted object is gone from the bucket',
    !after?.some((o) => objectPath.endsWith(o.name)),
    `${after?.length} still listed`,
  )
}

// ---------------------------------------------------------------------
// Cleanup (best effort, by the zz-rls markers — also after a failed run)
// ---------------------------------------------------------------------

async function cleanup(admin) {
  // Deleting the game cascades its DLC and game_genres; the cleanup trigger removes its
  // item_images, item_tags and item_relationships rows.
  for (const table of Object.values(ITEM_TABLES)) {
    await admin.from(table).delete().like('title', `ZZ RLS % ${suffix}`)
  }
  for (const table of ['platforms', 'genres', 'tags']) {
    await admin.from(table).delete().like('slug', `zz-rls-%-${suffix}`)
  }
  const { data: objects } = await admin.storage.from(BUCKET).list('zz-rls')
  if (objects?.length)
    await admin.storage
      .from(BUCKET)
      .remove(objects.map((o) => `zz-rls/${o.name}`))

  const leftovers = []
  for (const table of Object.values(ITEM_TABLES)) {
    const { count } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .like('title', 'ZZ RLS %')
    if (count) leftovers.push(`${count} ${table}`)
  }
  for (const table of ['platforms', 'genres', 'tags']) {
    const { count } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .like('slug', 'zz-rls-%')
    if (count) leftovers.push(`${count} ${table}`)
  }
  const { data: left } = await admin.storage.from(BUCKET).list('zz-rls')
  if (left?.length)
    leftovers.push(`${left.length} Storage object(s) under ${BUCKET}/zz-rls/`)
  if (leftovers.length)
    console.warn(
      `⚠ Left behind: ${leftovers.join(', ')} — delete them in the dashboard.`,
    )
}

// ---------------------------------------------------------------------

await checkSignupsDisabled()

const admin = await signIn(env.RLS_ADMIN_EMAIL, env.RLS_ADMIN_PASSWORD, 'Admin')
const user = await signIn(
  env.RLS_USER_EMAIL,
  env.RLS_USER_PASSWORD,
  'Non-admin user',
)
const userId = (await user.auth.getUser()).data.user.id

try {
  const fixtures = await createFixtures(admin)
  await checkOutsider('anon', client(), fixtures, userId)
  await checkOutsider('user', user, fixtures, userId)
  await checkAdminWrites(admin, fixtures)
  await checkAdminDeletes(admin, fixtures)
} catch (error) {
  check('setup', 'table checks', false, error.message)
}
try {
  await checkStorage(client(), user, admin)
} catch (error) {
  check('setup', 'storage checks', false, error.message)
} finally {
  await cleanup(admin)
}

const failed = results.filter((r) => !r.ok)
for (const r of results)
  console.log(
    `${r.ok ? '✓' : '✖'} [${r.who}] ${r.what}${r.ok ? '' : `  → ${r.detail}`}`,
  )
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed`,
)
process.exit(failed.length ? 1 : 0)
