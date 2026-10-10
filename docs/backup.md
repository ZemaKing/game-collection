# Backup & restore

The project is on Supabase **Free**: there are no dashboard database backups and deleted Storage
objects can't be recovered. These scripts keep a local copy of both. They read with the
**service-role key** from `.env.local` (`SUPABASE_SERVICE_ROLE_KEY`, never `VITE_`-prefixed, never
committed) and never write to Supabase. Everything lands in `backups/`, which is git-ignored.

| What | Command | Output | Egress |
| --- | --- | --- | --- |
| Image inventory | `npm run images:audit` | `docs/images-audit.md` | ~0 (metadata only) |
| Images | `npm run images:backup` (plan) → `-- --apply` | `backups/images/<storage path>` + `manifest.json` | Only files not yet backed up |
| Image check | `npm run images:backup -- --verify` | — | None (offline) |
| Database data | `npm run db:export` | `backups/db/<timestamp>/<table>.json` + `manifest.json` | ~1–2 MB |

## Egress

The org's Free quota is **5 GB of egress a month, shared with the recipes app** (Dashboard →
Organization → Usage; the cycle resets on the 10th). The first full image backup downloads the
whole bucket (**≈ 1.45 GB** planned on 2026-10-09; **1.63 GB / 3,196 objects** when it ran on
2026-10-10). After that the backup is incremental: a run downloads
only objects that aren't in the manifest yet, so routine runs cost a few MB. Always run the plan
(no `--apply`) first; it prints the exact download size.

## Routine

- **After adding or changing photos:** `npm run images:backup -- --apply`, then `--verify`.
- **Weekly, or after a big edit session:** `npm run db:export`. Old exports can be deleted by hand;
  keep at least the last few.
- **Second copy:** copy the whole `backups/` folder to a second place (external disk or cloud
  drive) after each full or larger backup, then check it against its checksums:
  `npm run images:backup -- --verify --root=<copy>/images`.

## What the image manifest holds

`backups/images/manifest.json` has one entry per object: `path` (the Storage path, also the local
path under `backups/images/`), `bytes`, `sha256`, `width`/`height`/`format` (read from the file
header), `contentType`, `eTag`, `lastModified`, and `rows`: the `item_images` rows that used it
(`id`, `item_type`, `item_id`, `position`, `is_cover`, `alt_text`). `complete: true` means the last
run fetched everything in the bucket.

## Restore

### One image or a few

Upload the file from `backups/images/<path>` to the **same path** in Storage → `item-images`
(Dashboard → Storage → item-images → the item's folder → Upload). The `item_images` row still
points at that path, so the image reappears. If the row is gone too, insert it from the
manifest's `rows` entry (SQL editor):

```sql
insert into public.item_images (id, item_type, item_id, storage_path, position, is_cover, alt_text)
values ('<id>', '<item_type>', '<item_id>', '<path>', <position>, <is_cover>, <alt_text or null>);
```

Since the Phase 34 WebP flip (2026-10-10) a row points at `<row id>.webp` + `<row id>.thumb.webp`;
the migrated rows also keep their pre-WebP file in `original_path`. Back up after the flip
(`images:backup -- --apply` picks up the new WebPs) so the local copy holds what rows point at.

### Many images

Write a small script that walks the manifest and uploads each file with the service-role client
(`storage.from('item-images').upload(path, bytes, { contentType, upsert: false })`).

### Undoing the WebP migration

While the originals are still in Storage (until Phase 37): `npm run images:flip -- --rollback --apply`
points every migrated row back at its `original_path`, in one transaction, with no deploy
(`scripts/migrate-images/README.md`). After Phase 37 the originals exist only in
`backups/images/`: re-upload them to their old paths first, then roll back.

### Database

The schema comes from `supabase/migrations/` (baseline first, then the later files, in the SQL
editor). Then load the data table by table **in the order of `manifest.json`** (parents before
children, so the foreign keys and the item-reference triggers pass). For each table, in the SQL
editor:

```sql
insert into public.games
select * from json_populate_recordset(null::public.games, $json$<contents of games.json>$json$);
```

`admin_users` references `auth.users`, which isn't exported: after a restore into a fresh project,
create the owner account first and re-insert its id (see the Phase 31 migration header).

### Full dump (optional)

For a schema + data dump in one file, `pg_dump` can run through Docker Desktop (no local Postgres
needed). Use the **session pooler** connection string from Dashboard → Connect (it holds the DB
password, so never commit the output):

```bash
docker run --rm postgres:17 pg_dump "<connection string>" --schema=public --no-owner > backups/db/full.sql
```
