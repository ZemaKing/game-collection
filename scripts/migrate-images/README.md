# Item images → WebP (ROADMAP Phases 33–34)

Converts every `item_images` original that predates Phase 36 (rows uploaded since are already WebP and are skipped) to two WebP objects with the generic pipeline in [`../images/`](../images/README.md). The originals come from the **local backup** (`backups/images/`, made by `npm run images:backup`), so converting them costs no download egress. Only the uploads in Phase 34 touch the network.

| | |
| --- | --- |
| Source | `item_images.original_path ?? storage_path`, read from `backups/images/<path>`. Its sha256 must match `backups/images/manifest.json` |
| Objects | `{item_type}/{item_id}/{row id}.webp`: **full**, fits 1600×1600, q85 · `{item_type}/{item_id}/{row id}.thumb.webp`: **thumb**, fits 600×750, q85. Next to the original, named after the row (stable across runs, never the original's own name). `Cache-Control: max-age=31536000` |
| Record | `manifest.json` (written on `--apply` only): per object, the source (row id, original URL, sha256), settings, output sha256, bytes and dimensions. Commit it after the Phase 34 run |
| Rows | Unchanged by the upload. `npm run images:flip` sets `original_path`, `storage_path`, `thumb_path`, `width` and `height` for every migrated row in one transaction (`public.set_item_image_variants`, migration `20261012120000`, service role only) |

**Why these sizes** (measured 2026-10-09): cards are `aspect-[4/5]` and at most 216 CSS px wide on listings, 281 px on the dashboard (1535 px wide), and 296 px on a 639-px landscape phone. At 2× that's ≈ 600×750, which also covers portrait phones at 3× (164–192 px cards). The viewer on a 1080p screen is height-bound, so it shows a 16:9 screenshot at ≈ 1600 px wide. Quality 85 was the owner's choice. Every cover is portrait box art, and 81 % of gallery images are 16:9 screenshots.

## Commands

Needs `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

```bash
npm run images:backup -- --apply           # Phase 32: every original on disk first
npm run images:migrate                     # dry run: convert all from the backup, print sizes (nothing uploaded)
npm run images:migrate -- --limit=10 --apply   # Phase 34
npm run images:check                       # HEAD every uploaded object vs the manifest (--full: sha256 too)
npm run images:flip                        # dry run: plan + HEAD every object + exact counts, rolled back
npm run images:flip -- --apply             # point the rows at the WebPs (one transaction)
npm run images:verify                      # every row's storage_path + thumb_path answers 200 image/webp
```

## Flip and rollback

The flip only runs when every migrated row has both variants in the manifest, made from that row's current original with the current settings, and every one of those objects answers HEAD 200 with the manifest's type and size. Any problem blocks the whole flip. The SQL function also refuses a row whose `storage_path` changed after the plan was made, so an image the owner edits in the meantime is never overwritten. Rows born WebP (Phase 36) are not touched.

```bash
npm run images:flip -- --rollback          # dry run
npm run images:flip -- --rollback --apply  # storage_path ← original_path; thumb_path, width, height, original_path → null
npm run images:verify -- --originals       # also HEAD every original_path (the rollback path)
```

The app needs no deploy either way: the read path (Phase 35) falls back to `storage_path` when a row has no thumb. The WebP objects stay in Storage after a rollback, so flipping forward again is just `images:flip -- --apply`. The rollback path lasted until Phase 37 deleted the originals.

## The small variant (Phase 39, gap 3)

A third variant, `{name}.small.webp` next to each full image: a 4:5 centre crop at 400×500 (q85), which is exactly what a card or strip shows (`aspect-[4/5]` + `object-cover`). The app offers it next to the thumb through `srcset`/`sizes` (`src/features/items/imageSizes.ts`), and the browser upload makes it for new images. [`small-job.ts`](small-job.ts) makes it for the rows that predate that, reading the pruned original from the backup (via `prune-log.json`) or the backed-up full image, and downloading only what isn't on disk.

```bash
npm run images:small                       # dry run: convert, print sizes
npm run images:small -- --apply            # upload (resumes; small-manifest.json is the record)
npm run images:small-check -- --full       # every object vs small-manifest.json
npm run images:small-flip [-- --apply]     # HEAD every object, then write small_path in one transaction
```

Needs migration `20261013120000_item_image_small.sql` (`small_path`, `all_items.cover_small_path`, `set_item_image_small`) before the flip and before deploying the app code that selects those columns. Undo: `update item_images set small_path = null`, and the app loads the thumb alone again.

## Retiring the originals (Phase 37, done 2026-10-10)

```bash
npm run images:prune-originals                   # dry run: plan + re-hash every local backup file + HEAD every WebP
npm run images:prune-originals -- --limit=5 --apply   # a trial batch
npm run images:prune-originals -- --apply        # the rest, then original_path → null in one transaction
```

An original is deleted only when its row serves the WebPs made from it, the original is in the backup manifest and its local file re-hashes to the recorded sha256, and no row serves the same path. Every deleted path goes to [`prune-log.json`](prune-log.json). Since then `images:flip -- --rollback` has nothing to restore; going back means re-uploading from the backup first (`docs/backup.md` → "Undoing the WebP migration").

A source whose original isn't in the backup fails with `… is missing (local source)`. Run `images:backup -- --apply` again, then re-run. Nothing falls back to downloading.

Dry run on 2026-10-09 with 615 of 1,426 originals backed up: 615 converted, 0 conversion failures, every sha256 matched. Average output: full 134.5 KB and thumb 40.7 KB, so ≈ 250 MB for all 1,426 (the originals are 1.45 GB).
