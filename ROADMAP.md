# Game Collection — Images, Security & Hardening Roadmap

Follow-up to [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md), which built the app (Phases 1–28 done). Its two open phases — **29 Performance** and **30 Testing Hardening** — are folded into this roadmap (Phases 39 and 40), so numbering continues at **31**. Once this roadmap is approved, `DEVELOPMENT_PLAN.md` becomes a history file and this is the live tracker (update `CLAUDE.md` in Phase 31).

The image pipeline reuses the one built for the diecast app (`../diecast-collection/scripts/images/` + `src/lib/image-resize.ts`), which was written app-agnostic for this purpose (diecast ROADMAP Phase 21).

**Status: Phase 33 code done and its migration applied; Phases 35 and 36 code done ahead of Phase 34 (owner-approved, 2026-10-09): the app reads thumbs as soon as Phase 34 fills them, and new uploads are already stored as WebP. The full image backup (Phase 32) waits for the egress reset on 2026-10-10, then the full Phase 33 dry run, then Phase 34.** Research done 2026-10-04 (findings below).

---

## Findings (measured 2026-10-04)

All numbers come from the live project: public anon reads of `item_images` and Storage `HEAD`s of all 1,811 objects. 40 of them were downloaded and converted with `sharp` to measure the WebP savings. Nothing was written.

### Images — the main problem

| What | Measured |
| --- | --- |
| Items / image rows | 427 items (`all_items`), **1,811** images (~4.2 per item). 0 orphaned Storage objects |
| Formats | **1,106 PNG (1,527 MB, avg 1.41 MB)** · 698 JPEG (481 MB, avg 705 KB, max 7.1 MB) · 7 WebP (0.8 MB) |
| Bucket `item-images` total | **≈ 2.0 GB** (by type: game 1,384 MB · steelbook 395 MB · stuff 104 MB · dlc 66 MB · artbook 21 MB · special edition 21 MB · figure 18 MB) |
| Dimensions (sample of 40) | width 344–2014 px, median 1440; typical 1422×800, 600×750, 1920×1080; 6 of 40 have transparency |
| WebP, same sample | original avg **1,079 KB** → 1600 px WebP q82 **115 KB (−89 %)** · 800 px **46 KB** · 400 px **14 KB** |
| Served as | **The original file everywhere**: grid/list cards, the dashboard, related items, the detail gallery strip, the viewer. `storage.ts` builds plain public URLs, there are no thumbnails |
| Caching | `Cache-Control: public, max-age=3600` (supabase-js default); paths are UUIDs and never overwritten, so they could be cached for a year |
| Upload path | `imageApi.ts` uploads the picked file untouched (JPEG/PNG/WebP/GIF ≤ 10 MB). The RAWG cover import (`games-image-proxy` → `appendItemCoverImage`) does the same |
| Home page hero | `public/dashboard_cover.png`: **2.3 MB, 2172×724 PNG** as a CSS background, shown at 110–160 px high |

**What this costs:**
- **Storage quota.** Supabase Free quotas are per organization: 1 GB Storage and 5 GB egress a month. This org also holds the recipe project (~84 MB of images), so it stands at **≈ 2.1 GB of 1 GB**. Supabase blocks uploads once the Storage quota is exceeded (after a grace period). Check the dashboard → Usage page for the org's current state; see Open decision 1.
- **Egress.** One listing page (20 cards) ≈ 20 × 1.1 MB ≈ **22 MB**. The dashboard (12 cards + hero) ≈ **15 MB**. 5 GB a month is about **230 listing-page views**, shared with the recipes app. With 600 px WebP thumbnails, the same page is ≈ 0.6 MB (~40× less).
- **Speed.** Every card downloads a phone-sized photo, and the LCP on the dashboard is a 2.3 MB background image.

**Update 2026-10-09 (`docs/images-audit.md`):** the owner deleted every non-game image on 2026-10-08, so the bucket now holds **1,426 objects, 1.45 GB** (730 PNG 987 MB · 664 JPEG 463 MB · 32 WebP 2.4 MB), all under `game/`; 160 non-game items have no images. 0 orphans, 0 broken rows; 19 pairs of identical files are used by two different games (kept: each row owns its own object). The org's Usage page (cycle 10 Sep – 10 Oct) showed Storage 1.113 GB, **egress 3.88 GB of 5 GB** + 3.02 GB cached, uploads not restricted.

**Target after this roadmap:** ≈ 1,426 × (134.5 KB full + 40.7 KB thumb) ≈ **0.25 GB** in the bucket (−83 %), measured by the Phase 33 dry run (q85, the owner's choice). (Originally estimated as 1,811 × (115 + ~28 KB) ≈ 0.26 GB.) The org total drops to ≈ 0.3 GB of 1 GB, and a listing page needs ≈ 0.6 MB.

### Security — urgent

- **Sign-ups are enabled.** `GET /auth/v1/settings` returns `disable_signup: false` (email confirmation is on).
- **Every write policy is `to authenticated using (true)`** (all item tables, `item_images`, relationships, tags, and Storage writes). So anyone who registers and confirms an email can **edit or delete the whole collection and every photo**. `CLAUDE.md` says "only the authenticated owner can write", but today the database enforces "any signed-in user". Nothing has been tested by signing up; this comes from reading the settings and the migration.
- The anon key can **list** the whole bucket (a public `SELECT` policy on `storage.objects`). That's harmless for a public gallery, but it isn't needed: public URLs work without it.

### Health

- `npm ci` · `npm run lint` ✅ · `npm test` ✅ **95 tests / 12 files** · `npm run build` ✅. Initial JS ≈ 104 kB gzip (`index`) + 60 kB (`supabaseClient`).
- CI (`.github/workflows/ci.yml`) runs lint/test/build. It isn't a required check yet (branch protection).
- `DEVELOPMENT_PLAN.md` notes that `RAWG_API_KEY` was missing in production at Phase 23, so autofill returns 500 there. Unverified since.
- Final checklist still open: backup/recovery procedure, README (setup, migrations, seed, env, testing, deploy), and the Desktop/Tablet/Mobile verification sweep.

---

## Workflow rules

1. **One phase at a time.** Never continue into the next phase without explicit approval.
2. At the end of every phase, report: (1) what changed, (2) files added, (3) files modified, (4) DB migrations, (5) manual actions required from the owner, (6) test/build/lint status, (7) roadmap updated. Then **STOP**.
3. **No image is deleted from Storage until its WebP replacement is verified *and* a local backup with checksums exists.** Deleting originals is its own phase (37) and needs explicit approval.
4. Migrations are new timestamped files after the baseline, applied by the owner in the dashboard SQL editor (as today). `all_items` changes go through a migration + `AllItemRow`/`ItemDetail`.
5. New dependencies need a one-line justification in the phase report.
6. A service-role key never enters frontend code, a `VITE_*` variable, or git. Scripts read it from `.env.local`.
7. **Egress budget:** any script that downloads whole buckets reports the bytes it will download first and asks before running. The org's 5 GB/month is shared with the recipes app.

## Global Definition of Done

- `npm run lint`, `npm test` and `npm run build` pass (CI green); no new warnings.
- UI phases: checked at Desktop, Tablet and Mobile (the Working Rules of `DEVELOPMENT_PLAN.md` still apply), both themes, both languages (new strings in `sr` **and** `en`).
- Pure logic has co-located Vitest tests.
- `ROADMAP.md` checkboxes and the status table are updated.

## Architecture target (images)

```
Upload (browser):  File ─► image-resize.ts (canvas → WebP full 1600 + thumb 600) ─► Storage item-images ─► item_images row {storage_path, thumb_path, width, height}
Read:              cards / lists / strips ─► thumb_path ?? storage_path     detail main / viewer ─► storage_path
Existing files:    scripts/images (sharp) ─► WebP variants at new paths ─► verify ─► flip rows in one transaction ─► (later) delete originals
```

- **Variants** (decided 2026-10-09, Phase 33): `full` fits inside 1600×1600, `thumb` fits inside 600×750, both **q85** (the owner's choice), never enlarged. Measured: cards are `aspect-[4/5]` and at most 216 CSS px wide on listings, 281 px on the dashboard, and 296 px on a 639-px landscape phone, so ≈ 600×750 is sharp at 2× (and on 3× portrait phones). The viewer on a 1080p screen is height-bound at ≈ 1600 px for 16:9. Transparency is kept (WebP alpha).
- **Paths:** `{item_type}/{item_id}/{uuid}.webp` and `{uuid}.thumb.webp`. The migration uses the `item_images` row id as `{uuid}` (stable across runs, never an original's name). A changed photo always gets a new UUID, so objects are uploaded with `Cache-Control: max-age=31536000, immutable`.
- **Rollback column:** `original_path` keeps the pre-migration object until Phase 37.

## Status

| # | Phase | Status | Needs from owner |
| --- | --- | --- | --- |
| 31 | Security Lockdown | ✅ Done (2026-10-09) | — |
| 32 | Image Audit & Local Backup | ✅ Done (2026-10-10: full backup verified, copied to a second place) | — |
| 33 | Image Pipeline Port & Schema | ✅ Done (2026-10-10: dry run 1,426/1,426, 0 failures) | — |
| 34 | WebP Migration of Existing Images | ✅ Done (2026-10-10: 1,426 rows flipped, rollback tested) | — |
| 35 | Read Path: Thumbnails Everywhere | ✅ Done (2026-10-10: listing 20 cards ≈ 1.07 MB of thumbs, was ≈ 22 MB; ≥ 2× px on cards) | — |
| 36 | Upload Path: WebP in the Browser | 🟡 Code done (before 34, owner-approved) | Check the RAWG cover import on the next autofill (migration applied, test uploads verified 2026-10-09) |
| 37 | Retire Originals (free the quota) | ✅ Done (2026-10-10, owner-approved: 1,426 originals / 1.45 GB deleted; bucket 437 MB, all WebP) | Check the Usage page shows Storage < 1 GB once it refreshes |
| 38 | Static Assets (dashboard hero, icons) | ✅ Done (2026-10-09; 37 skipped for now, owner-approved) | Optional: a better hero source image (drop it in `static-src/`, run `images:static`) |
| 39 | Performance Pass (was Phase 29) | ✅ Done (2026-10-10, image numbers measured; photo LCP on mobile is gap 3 in `docs/performance.md`) | Decide on gap 3 (a phone-sized image variant, and/or route-level data loading) |
| 40 | Testing Hardening (was Phase 30) | 🟡 Code done (2026-10-09); E2E in CI waits for the secrets | Add repo secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; make the `verify` CI check required (GitHub setting) |
| 41 | Operations, Docs & Production Verification | 🟡 Docs done and `RAWG_API_KEY` live (2026-10-10); the production sweep waits for the owner | Production sweep (`docs/production-verification.md`); go/no-go |

---

## Phase 31 — Security Lockdown

### Goal
Make "only the owner can write" true in the database, not just in the UI. This comes first because today any registered user can wipe the collection.

### Tasks
- [x] **Owner, now:** Dashboard → Authentication → Sign In / Providers → turn off "Allow new users to sign up". Then check the Users list for unknown accounts
- [x] Migration: `admin_users (user_id uuid primary key references auth.users)`, with RLS on and no API grants, plus `is_admin()` (`security definer`, `stable`, `search_path` pinned) — the diecast pattern
- [x] Migration: replace every `*_owner_write` / `to authenticated using (true)` policy with `using (is_admin()) with check (is_admin())`, on the 7 item tables, `item_images`, `item_relationships`, `item_tags`, `game_genres`, `tags`, `platforms`, `genres`
- [x] Storage: `insert/update/delete` on `storage.objects` for `item-images` only for `is_admin()`. Drop the public `SELECT` policy (public URLs don't need it; this stops anonymous bucket listing). Re-check `file_size_limit` / `allowed_mime_types`
- [x] Owner inserts their user id into `admin_users` (SQL in the phase report)
- [x] `scripts/verify-rls.mjs` (`npm run verify:rls`): checks as anon and as a signed-in **non-admin** test user (`RLS_*` logins in `.env.local`) that reads succeed and every write/delete/upload/list is refused, and that the admin can write (self-cleaning fixtures)
- [x] Point `CLAUDE.md` at this roadmap; describe the admin allow-list there

### Verification
- [x] `/auth/v1/settings` reports `disable_signup: true` (2026-10-09)
- [x] `verify:rls` is green (165/165, 2026-10-09): anon and non-admin are refused on every table and on Storage writes and list; admin CRUD works
- [x] The owner can still add, edit and delete an item and an image in the app (2026-10-09: a test Stuff item created with a tag, edited, PNG uploaded and shown, image deleted — file and row gone — then the item deleted)

### Definition of Done
Writes require `is_admin()` everywhere; sign-ups are off; a script proves it.

---

## Phase 32 — Image Audit & Local Backup

### Goal
Take one complete, checksummed copy of every original before anything is converted or deleted. Use that same copy as the conversion source, so the bucket is downloaded **once**.

### Tasks
- [x] Owner: Dashboard → Organization → Usage. Record Storage size, this month's egress, and whether uploads are restricted; record the billing-cycle reset date (→ Open decision 1). *2026-10-09: Storage 1.113 GB, egress 3.88/5 GB, cached egress 3.02 GB, not restricted; resets 10 Oct (recorded in the findings above)*
- [x] Owner: add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (git-ignored, never `VITE_`)
- [x] `scripts/images-audit.mjs` (`npm run images:audit`): lists every `item_images` row and Storage object, then reports counts, bytes by format and type, orphans (row without object / object without row), and duplicates. Uses the Storage list API's metadata (no `HEAD`s needed), so almost no egress. Writes `docs/images-audit.md`. *Plain `.mjs` like `verify-rls.mjs`, so no `tsx` until Phase 33*
- [x] `scripts/images-backup.mjs` (`npm run images:backup`): downloads every original to git-ignored `backups/images/<path>`, writes `backups/images/manifest.json` (path, bytes, sha256, width, height, content-type, plus the `item_images` rows using each file), and resumes (skips files already there with a matching sha256). It prints the expected download size and needs `--apply`; `--limit=N` for a trial, `--verify [--root=…]` re-hashes a copy offline. Tried on 3 files (1.57 MB)
- [x] **Run the full backup after the reset on 10 Oct** (≈ 1.45 GB; this cycle has only ~1.1 GB of egress left). *2026-10-10: by then the bucket had grown to 3,196 objects / 1.63 GB (images uploaded on 2026-10-09 through the Phase 36 path, each a WebP + thumb); all of it backed up*
- [x] Copy the backup to a second place (external disk / cloud drive) — owner *(done 2026-10-10)*
- [x] Also export the database (Dashboard → Database → Backups is not on Free, so: `pg_dump` with the DB connection string, or a CSV export of every table) and document it in `docs/backup.md`. *`npm run db:export` → JSON per table + checksummed manifest (no `pg_dump` installed; the Docker route is documented). First export 2026-10-09: 15 tables, 1.29 MB*

### Verification
- [x] The audit totals match the findings above (±new uploads): ~1,811 objects, ~2.0 GB, 0 orphans. *1,426 objects / 1.45 GB, 0 orphans — the difference is the owner's deletion of the non-game images on 2026-10-08 (see the update in the findings)*
- [x] The backup has all 1,426 files; a second run downloads 0 bytes; all sha256 recorded (`--verify` green). *2026-10-10: 3,196/3,196 files (the 1,426 originals plus the newer WebPs); second run 0 B; `--verify` 3,196/3,196*
- [x] Egress used by the backup (≈ 1.45 GB) is noted against the month's budget. *≈ 1.6 GB of the 5 GB cycle that started 2026-10-10 (dashboard before it: egress 0.017 GB, cached 0.026 GB; Storage 1.511 GB = 151 % of the Free 1 GB)*

### Definition of Done
A verified local copy of every original plus a DB export exists in two places.

---

## Phase 33 — Image Pipeline Port & Schema

### Goal
Bring the diecast WebP converter in, and give `item_images` room for variants. No row changes yet.

### Tasks
- [x] Owner decision on sizes (2026-10-09): measured display sizes + a trial on 120 backup images → thumb 600×750, full 1600, **q85** (see the architecture above; closes Open decision 5)
- [x] Copy `scripts/images/` from diecast (commit `993da26`; batch, convert, retry, manifest, verify, supabase-target, paths + their tests), kept in diecast's style (`.prettierignore`). Dev dependencies: **`sharp`** (WebP encoding, used by scripts only), **`tsx`** (runs the TS scripts)
- [x] Add a **local source** option: `ImageSource.file` (+ an expected `sha256`) reads the original from disk and never falls back to the network. Plus `Variant.pathPattern` for the `.thumb.webp` name. Both generic; the divergence is noted at the top of `scripts/images/README.md` (not yet ported back to diecast)
- [x] Migration `20261010120000_item_image_variants.sql`: `item_images` gets `thumb_path`, `width`, `height` (both or neither, > 0) and `original_path`. `all_items` gets `cover_thumb_path` via `create or replace view`, **appended as the last column**: that keeps the view, its grants and the search functions in place without a drop, and the app selects by name. Types: `AllItemRow.cover_thumb_path`, `ItemImageRow.thumb_path/width/height/original_path`, all optional until Phase 35 selects them. `ItemDetail` has no image fields, so it needed nothing
- [x] `scripts/migrate-images/job.ts`: the games `ImageJob` (bucket `item-images`, `{item_type}/{item_id}/{row id}.webp` + `.thumb.webp`, `cacheControl` one year). It reads `original_path ?? storage_path` from `backups/images/`, checks the backup's sha256, and refuses any output path that equals an original's
- [x] `tsconfig.scripts.json` so `tsc -b` type-checks `scripts/` too; npm scripts `images:migrate`, `images:check`
- [x] Tests: the copied suites pass; local-source tests (reads the file, no network; a missing file or a sha256 mismatch fails without retry); a path-pattern test for every item type; the overwrite guard (149 tests in total)

### Verification
- [x] `npm run images:migrate` (dry run) converts all 1,426 from the local backup and prints the before/after sizes. *2026-10-10, full run: 1,426/1,426, 0 failed; originals 1,385.8 MB → 248.2 MB (full 191.4 MB, avg 137.5 KB; thumb 56.8 MB, avg 40.8 KB). Rows born WebP since Phase 36 (thumb set, no original) are skipped by design. 2026-10-09, with 615 backed up: 615/615 converted, 0 conversion failures, every sha256 matched; 557.7 MB → 105.2 MB (full avg 134.5 KB, thumb 40.7 KB) ⇒ ≈ 0.25 GB for all. Re-run after the full backup*
- [x] The app works unchanged after the migration (new columns are null, the view still returns everything). *2026-10-09: migration applied by the owner; `all_items` returns all 432 items with `cover_thumb_path` last (all null), and the listing renders with no console errors*

### Definition of Done
A dry run over every image succeeds with zero failures; the schema is ready; no user-visible change.

---

## Phase 34 — WebP Migration of Existing Images

### Goal
Upload WebP variants for every image, verify them, then switch the rows over in one step, with a tested rollback.

### Tasks
- [x] Owner runs `images:migrate -- --limit=10 --apply`, checks, then the rest. Re-runs resume. **If uploads are blocked by the quota** (Open decision 1), follow the decided plan before continuing. *2026-10-10 (run by Claude, owner-approved): 10, checked (HEAD + `--full` 20/20), then the rest. 4 sources failed on "Too many connections issued to the database" (Storage's own DB, transient) and went through on re-run. 1,426/1,426 uploaded, 2,852 objects, 247.8 MB. Uploads were not blocked at 151 % of the Storage quota*
- [x] `images:check`: `HEAD` every new object (status, type, size vs manifest). Run a `--full` sha256 check on a sample only (~50 objects) to spare egress. *2,852/2,852 after retrying a handful of HTTP 429s; the sample is `images:verify -- --sample=50` (50/50 match). Storage rate-limits HEADs at concurrency 8, so `images:flip`/`images:verify` use 3 with 8 retries*
- [x] DB function `set_item_image_variants(jsonb)` (service role only, one transaction): sets `original_path = storage_path`, `storage_path = <full webp>`, `thumb_path`, `width`, `height` for every row. It refuses if any row's current `storage_path` isn't the one recorded in the manifest. *Migration `20261012120000_set_item_image_variants.sql` (applied by the owner 2026-10-10). Each payload row carries `expected_storage_path`; unknown ids or changed rows abort the whole call. Smoke-tested: a dry run changes nothing, a stale row is refused*
- [x] `images:flip` (dry run by default, `--apply`), and `images:flip -- --rollback --apply` (restores `storage_path` from `original_path` and clears the thumbs). *Plan logic in `plan.ts` (unit-tested). Before a flip every object must answer HEAD with the manifest's type and size. Plus `images:verify` (HEAD every row's paths, `--originals`, `--sample=N`)*
- [x] Commit `scripts/migrate-images/manifest.json` as the record

### Verification
- [x] 1,811/1,811 rows point at WebP; every `storage_path` and `thumb_path` answers 200 `image/webp`. *2026-10-10: 2,311/2,311 rows (1,426 flipped + 885 born WebP since Phase 36); `images:verify -- --originals` HEAD 6,048 URLs → all 200*
- [x] Rollback exercised once (flip → rollback → flip), with the app checked after each. *2026-10-10: after the rollback the detail page and listing loaded the original PNG/JPGs (no deploy needed), then flipped again*
- [x] Spot-check 20 items across all 7 types in the browser (incl. transparent figure/stuff images). *2026-10-10, dev server against the live data: the listing of every type (games 20, DLC 20, special editions 20, steelbooks 20, artbooks 10, figures 4, stuff 20 cards) loads only `.thumb.webp`, none broken; a game detail page loads the full WebP + 6 gallery thumbs*

### Definition of Done
Every image row serves WebP; originals are untouched in Storage and backed up locally.

---

## Phase 35 — Read Path: Thumbnails Everywhere

### Goal
Each place loads the smallest image that looks sharp there.

### Tasks
- [x] `storage.ts`: `getImageUrls(row) → { full, thumb }` (`thumb_path ?? storage_path`), plus `imagePathFor(row, variant)` and `imageObjectPaths(row)`; unit-tested
- [x] `ItemImage` gets `variant: 'thumb' | 'full'` (default `thumb`) and `thumbPath`. A thumb that fails to load falls back to the full image before the placeholder. **Thumb:** `ItemCard` grid + list (so dashboard, recently added, platform pages, related items and the DLC section, which all render `ItemCard`), `ImageManager` tiles, the detail gallery strip, the viewer's thumbnail strip. **Full:** the detail page's main image and the `MediaViewer` stage. Search results and the relationship picker show no images
- [x] Image queries select `thumb_path, width, height, original_path` (`ITEM_IMAGE_COLUMNS`); `all_items` rows carry `cover_thumb_path` via `select('*')`
- [x] Pass `width`/`height` to `<img>` where known (detail cover and viewer stage; `all_items` has no sizes, and cards sit in a fixed `aspect-[4/5]` box anyway); `decoding="async"` on every image
- [x] The first 6 cards (`PRIORITY_CARD_COUNT`) on listings, the dashboard and recently added load eager with `fetchpriority="high"`, as does the detail cover and the viewer stage; the rest stay lazy (the Settings "image loading" preference still applies, and "saver" still wins)
- [x] The viewer preloads its neighbours' `full` only (not in "saver" mode)
- [x] Also (needed once rows have variants, so done now rather than in Phase 36): deleting an image or an item removes every object the row owns (`storage_path`, `thumb_path`, `original_path`), and replacing a file clears `thumb_path`/`width`/`height`/`original_path` so no stale thumb shows

### Verification
- [x] Network tab: a listing page of 20 cards transfers ≲ 1 MB of images (was ≈ 22 MB); no `full` request until the detail page or viewer. *2026-10-10 after the flip: `/games` scrolled through its 20 cards loads 20 `.thumb.webp`, 1.07 MB in all (summed `content-length`; cross-origin resource timing reports 0), 0 full images; dashboard 0 full images. Before the flip: Checked 2026-10-09 before the flip: first 6 cards eager + `fetchpriority=high`, the rest lazy; detail cover eager/high on the full path, strip lazy; the viewer at 1/4 preloaded exactly images 4 and 2; no new console errors*
- [x] Desktop/Tablet/Mobile × both themes: no visible blur on cards on a 2× screen; viewer zoom still sharp. *2026-10-10, measured as image px per CSS px under `object-cover` on every loaded card: mobile 375 (listing, 164 px cards) ≥ 1.98, tablet 768 (dashboard) ≥ 2.22, desktop 1024 (listing) ≥ 1.96, desktop 1536 (dashboard) ≥ 2.42. The only cards under 2.0 are images whose original is itself smaller than the thumb box. The theme doesn't change image pixels. The viewer stage loads the full WebP (a 1422×800 screenshot shown at 1008×590), the strip uses thumbs*
- [x] Tests for `getImageUrls` and `ItemImage`'s variant choice (`storage.test.ts`, `ItemImage.test.tsx`, and an `ItemCard` thumb/priority case; 158 tests in total)

### Definition of Done
No list view downloads a full-size image.

---

## Phase 36 — Upload Path: WebP in the Browser

### Goal
New uploads arrive already small, so the bucket never fills up with multi-MB PNGs again.

### Tasks
- [x] Copy diecast `src/lib/image-resize.ts` + its test (no imports, kept in diecast's style via `.prettierignore`): decode once (EXIF-aware), step-down resize, `OffscreenCanvas` with a canvas fallback, WebP (`png` where a browser can't encode WebP)
- [x] One variant config for both paths: `src/features/items/imageVariants.ts` (`IMAGE_VARIANTS`, `IMAGE_CACHE_SECONDS`), used by `imageApi.ts` and by the migration job, so uploads and migrated images can't drift apart
- [x] `uploadItemImage` / `replaceItemImageFile` / `appendItemCoverImage` (RAWG import) produce `full` + `thumb`, upload both (`cacheControl` one year) as `{uuid}.webp` + `{uuid}.thumb.webp`, write `storage_path`, `thumb_path`, `width`, `height`, and clean up whatever was uploaded on failure (a failed thumb upload removes the full image; a failed row write removes both; a failed replace keeps the old objects)
- [x] Accept JPEG/PNG/WebP/GIF input; a GIF keeps its first frame and the upload area says so (owner decision 2026-10-09, closes Open decision 4). Input limit **kept at 10 MB** (owner decision). Migration `20261010130000_item_images_webp_only.sql` sets the bucket's `allowed_mime_types` to WebP + PNG
- [x] Per-file status in `ImageManager` gains an "Optimising…" step (queued → optimising → uploading → done/failed). Also fixed: a failed upload showed an empty label (it looked up a missing `images.error` key) and never exposed its reason; it now says "Failed", with the reason as a tooltip and for screen readers
- [x] The migration job skips rows uploaded this way (thumb set, no original), since they're already WebP and aren't in the backup
- [x] Delete paths remove both variants (and `original_path` if still set). *Done early in Phase 35*

### Verification
- [x] Owner uploads a phone photo (~4–8 MB) and a transparent PNG: stored as ~100–200 KB + ~25 KB WebP; the transparency is kept. *2026-10-09, owner uploads to a test game: a 16:9 screenshot → full 1600×900 104.6 KB + thumb 600×338 20.5 KB; a transparent PNG → 189.4 KB + 67.2 KB, alpha kept in both (0–255); both `image/webp`, `max-age=31536000`, rows have `thumb_path`/`width`/`height`, no orphan objects. A portrait upload (the owner's own rotated copy of the screenshot) → 900×1600 103.0 KB + thumb 422×750 28.9 KB, stored exactly as the file displays, with no rotation data left in it. Still untried: a real portrait camera photo whose rotation exists only as EXIF data. Earlier, in the dev browser without uploading: a generated 4000×3000 transparent PNG (6.2 MB) → full 1600×1200 WebP 19 KB + thumb 600×450 6 KB in 233 ms, alpha kept*
- [ ] The RAWG cover import stores WebP (same `uploadItemImage` path; check on the owner's next autofill)
- [x] Unit tests for the resize maths (fit box, never enlarge; the copied suite) and the upload/rollback order (`imageApi.test.ts`, mocked Storage; 174 tests in total)

### Definition of Done
No new object larger than ~400 KB reaches the bucket.

---

## Phase 37 — Retire Originals (free the quota)

### Goal
Remove the 1,811 original files from Storage once WebP has been live and stable, bringing the org back under 1 GB.

### Tasks
- [x] Wait period after Phase 35/36 (suggest ≥ 7 days of normal use) with no image regressions reported. *Skipped by the owner's decision on 2026-10-10 ("brisi originale"), the same day as the flip, after the Phase 34/35 checks*
- [x] Re-verify the local backup (sha256 of every file) **in both places** right before deleting. *`images:prune-originals` re-hashes every original's local file against the backup manifest before deleting (1,426/1,426 matched). The second copy was made by the owner on 2026-10-10 and wasn't re-hashed here: its location isn't known to the scripts (`images:backup -- --verify --root=<copy>/images` checks it)*
- [x] `images:prune-originals` (dry run by default, `--apply`): deletes only objects referenced by `original_path` whose row now points at a verified WebP, in batches, then clears `original_path`. Writes a deletion log. *Plan in `prune.ts` (unit-tested): the row must serve the WebPs made from that original, the original must be in the backup and served by no row; plus the local re-hash and a HEAD of every WebP. Clears `original_path` through `set_item_image_variants` (no new SQL). `--limit=5` trial first, then the rest: 1,426 deleted, 0 already gone. Log: `scripts/migrate-images/prune-log.json`*
- [x] Document the restore path: re-upload from `backups/images/` + `images:flip -- --rollback` (the rollback now needs the re-upload first). *`docs/backup.md` → "Undoing the WebP migration": `original_path` is cleared, so `prune-log.json` (row id → original path) is what maps the re-uploaded files back*

### Verification
- [ ] The bucket is ≈ 0.26 GB; the org's Usage page shows Storage < 1 GB and uploads allowed. *`images:audit` 2026-10-10: 4,622 objects, **437 MB**, all WebP, 0 orphans (more than 0.26 GB because ≈ 520 items' images were added since the estimate). The Usage page lags; owner to confirm*
- [ ] Every row still resolves (HEAD 200); the app is checked on each item type

### Definition of Done
Only WebP variants remain in Storage; originals live in the off-Supabase backup.

**Manual:** explicit approval before `--apply`.

---

## Phase 38 — Static Assets

### Goal
Fix the 2.3 MB home page hero and tidy the other static images.

### Tasks
- [x] `dashboard_cover.png` (2172×724, 2.3 MB) → `dashboard_cover-1200.webp` (52 KB) + `dashboard_cover-2172.webp` (134 KB; the source width, never enlarged), q80. No AVIF (WebP is already small enough). The CSS background is now an `<img>` with `srcset`/`sizes` (from AppShell's padding and sidebar widths), `object-cover` with the same `right` / `lg:right 25%` crop, `fetchpriority="high"`, `width`/`height`; the gradients and text backing are unchanged
- [x] Also: `og:image` pointed at the 2.3 MB PNG. It now uses `og-image.jpg` (1200×630, 112 KB, cropped from the right like the hero; JPEG because every link-preview crawler reads it) with `og:image:width/height`
- [x] `scripts/build-static-images.ts` (`npm run images:static`, sharp, offline). Sources live in `static-src/` (the PNG moved there, so it no longer ships); the output list is the pure `scripts/static-images/plan.ts` (tested). Re-running gives byte-identical files
- [x] Favicon: `favicon-32.png` (1.6 KB) and `apple-touch-icon.png` (180×180, padded on white, 7.3 KB) rendered from `favicon.svg`, linked in `index.html`. `favicon.svg` itself (26 KB) stays as is. No `manifest.webmanifest` (PWA stays optional)

### Verification
- [x] The dashboard transfers < 200 KB for the hero; it looks identical at the three breakpoints, both themes. *2026-10-09: 1× narrow pane loads only the 1200 file (53.8 KB transferred); desktop 1440 / tablet / mobile 2× show the same crop as before (`object-position` 100% 25% on lg, 100% 50% below), light and dark; the largest file in `dist/` is now 134 KB*

### Definition of Done
No static image over ~200 KB ships in `public/`.

---

## Phase 39 — Performance Pass (was Phase 29)

### Goal
Finish the old Phase 29 with real numbers, now that images are no longer the bottleneck.

### Tasks
- [x] Lab Web Vitals (LCP, CLS, INP-proxy) for dashboard, a listing page, a detail page and search, on mobile (slow 4G, 4× CPU) and desktop: ported diecast's `scripts/perf/vitals.mjs` + `scripts/lib/headless.mjs` (`npm run perf:vitals`, local Edge/Chrome, no new dependency), plus `/statistics`. **Storage images are blocked by default** (`--with-images` to include them) so 50 cold runs don't pull the multi-MB originals from the shared egress
- [x] Query payloads: listing-style queries select `ALL_ITEM_COLUMNS`, with two PostgREST computed fields (migrations applied by the owner): `has_description` replaces the description text (58 % of each row; the statistics response went 204 → 34 kB), and `format_slug` replaces the serial `item_tags` request after every query (`withFormats` removed). Both verified against the old rule on all 433 rows (0 mismatches). Indexes: none needed — queries cost 74–126 ms against a 76 ms bare round trip; `supabase/checks/performance.sql` holds the `EXPLAIN (ANALYZE)` set for later
- [x] Duplicate requests and re-renders: none found (the dashboard's "10 `all_items` requests" are 5 GETs + 5 CORS preflights). No TanStack Query — no churn to justify it
- [x] Bundle: `useSaveItem` was already edit-only; `DatePickerField` was pulled into every listing and the dashboard by the closed filter sheet and blocked the lazy page chunk (done at 2.44 s on mobile) — the sheet now loads on first use. `preconnect` to the Supabase URL in `index.html`. Also: the dashboard hero (the mobile LCP) is preloaded on `/` and has an 800 px variant for phones. Tried and reverted lazy top-bar dialogs (no net gain)
- [x] Budget written to `docs/performance.md` (LCP < 2.5 s on mobile, CLS < 0.1, TBT < 200 ms, listing ≤ 1 MB of images, initial JS ≤ 170 kB gzip)
- [x] Large-dataset check: listings/search/duplicates/related are paged or capped by the server; the one full pass (statistics) is covered by `statistics.scale.test.ts` with 1,500 and 15,000 generated rows (local test only)

### Verification
- [x] Before/after table in `docs/performance.md`; the budget is met or the gaps are listed. *2026-10-09: table written; mobile LCP dashboard 3.51 → 2.35 s, listing 2.66 → 2.36 s, search 3.34 → 2.77 s, statistics 1.96 → 1.87 s; CLS ≤ 0.084; TBT ≤ 71 ms. Gaps listed: search LCP (needs route-level data loading), initial JS ≈ 201 kB vs 170 (framework: react-dom + supabase-js). Image rows pending Phase 34. 2026-10-10, `--with-images` after the flip: listing images ≈ 1.1 MB per 20 cards (was ≈ 22 MB). Photos become the LCP: mobile listing 4.50 s, search 5.10 s, detail 3.65 s; desktop 0.70–1.51 s. Listed as gap 3 with a waterfall and options (phone-sized variant via `srcset`, route-level data loading, thumb as the detail page's narrow candidate)*

### Definition of Done
Old Phase 29's DoD: browse, search and detail stay responsive at the expected scale, with numbers recorded.

---

## Phase 40 — Testing Hardening (was Phase 30)

### Goal
Finish the old Phase 30: protect the core flows end to end.

### Tasks
- [x] Media viewer component test (old 30 leftover): `MediaViewer.test.tsx`, 9 cases (open on the requested image at full size, buttons + wrap-around, arrow keys, thumbnail strip on thumbs, swipe left/right/too short, zoom and un-zoom on change, close, single image, neighbour preload and none in data-saver)
- [x] Pull filter/search/duplicate logic out of the Supabase hooks into pure functions and test them (old 30 leftover): `filters.ts` (URL parse/serialise, `hasActiveFacets`, which also replaced two hand-copied checks), `listingQuery.ts` (genre/tag id intersection, release-year expression, page range), `duplicates.ts` (the duplicate rule), `mergeSearchResults` in `searchQuery.ts`. `useFilters`, `fetchItems`, `searchItems` and `findLikelyDuplicates` now call them; behaviour unchanged. 43 new tests (222 in total)
- [x] Playwright E2E (`@playwright/test` 1.64, dev dependency: the E2E runner; the locally installed Edge, so no browser download), at Desktop, Tablet and Mobile: browse, filter, search, detail, viewer, settings — 21 journeys × 3 layouts (`e2e/README.md`). **Read-only against production** (Open decision 3): a fixture fails any non-GET to Supabase (diecast pattern; proven with a throw-away POST), and Storage images are answered with a 1×1 PNG, so a run costs ≈ 2 MB of egress. Expected counts come from PostgREST, not the app
- [x] Owner flows (login, create/edit/delete, image upload, duplicate warning, unsaved-changes guard): no test project, so they're a manual checklist in `docs/production-verification.md`
- [x] CI: `npm run typecheck` (`tsc -b`, now also over `e2e/` via `tsconfig.e2e.json`) as its own step; the image-pipeline tests (`scripts/**/*.test.ts`, 60) already ran in `npm test`. E2E is a separate `e2e` job after `verify`, using the runner's Chrome; it is skipped with a notice until the two repo secrets exist, and keeps the report as an artifact on failure
- [ ] Owner: make the CI check required on `main` (GitHub → Settings → Branches)

### Verification
- [ ] E2E is green 3 runs in a row (no flakes); CI blocks a deliberately broken commit. *2026-10-09, locally: `--repeat-each=3` → 186 passed, 0 flaky, 3 skipped (Ctrl K on phones, by design). The CI half waits for the required-check setting and the secrets*

### Definition of Done
Core public flows are covered by E2E; owner flows by E2E or a documented manual checklist.

---

## Phase 41 — Operations, Docs & Production Verification

### Goal
Close the `DEVELOPMENT_PLAN.md` final checklist and ship it all.

### Tasks
- [x] `RAWG_API_KEY` set in Vercel (Production + Preview); autofill checked on the deployed site. *2026-10-10: set by the owner; `GET https://game-collection-six.vercel.app/api/games-search?q=halo` → 200 with RAWG results*
- [x] `docs/backup.md`: DB export + image backup procedure, how often, restore steps (the open "backup/recovery" item). *Written in Phase 32; 2026-10-10 added the post-flip state and how to undo the WebP migration*
- [x] README: setup, env, migrations (manual SQL-editor flow), seed, scripts (`images:*`, `verify:rls`), testing, deployment *(2026-10-10)*
- [x] `CLAUDE.md`: image variants, upload pipeline, admin allow-list, scripts *(kept current phase by phase; the flip state added 2026-10-10)*
- [x] Egress/storage watch: a short monthly check in the README (Usage page), or a script that sums the bucket. *README "Monthly quota check": the Usage page plus `npm run images:audit`, which sums the bucket from metadata*
- [ ] Release on a preview deployment → the owner checks it → `main`

### Verification
- [ ] On production: Desktop/Tablet/Mobile sweep of every screen (the final checklist item), sign-ups off, images WebP, autofill works

### Definition of Done
Every `DEVELOPMENT_PLAN.md` final-checklist item is ticked or explicitly deferred by the owner.

---

## Open decisions / inputs needed

| # | Question | Needed by |
| --- | --- | --- |
| 1 | **Over the Storage quota (≈ 2.1 GB of 1 GB, org-wide).** If uploads are already blocked, the WebP variants (~0.26 GB) can't be uploaded before space is freed. Options: (a) upgrade to Pro for one month ($25) during the migration; (b) after the verified local backup, delete originals per batch *before* uploading their WebP (the rollback then depends on the local backup); (c) migrate the recipes app first (frees ~70 MB, not enough on its own). Recommended: check the Usage page first; if blocked, (a) is the safest | Ph 32 / 34 |
| 2 | Keep originals anywhere online after Phase 37 (e.g. a cloud drive), or is the local + second-copy backup enough? | Ph 37 |
| 3 | ~~E2E: a separate test project or read-only against production?~~ **Decided 2026-10-09:** read-only against production (the diecast choice); owner flows are a manual checklist | ~~Ph 40~~ |
| 4 | ~~GIF uploads: convert or reject?~~ **Decided 2026-10-09:** convert to a still WebP (first frame); the upload area says so. Input limit stays 10 MB | ~~Ph 36~~ |
| 5 | ~~Thumb size 600 px vs 400 px~~ **Decided 2026-10-09:** thumb 600×750, full 1600, both q85 | ~~Ph 33~~ |
