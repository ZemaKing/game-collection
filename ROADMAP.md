# Game Collection — Images, Security & Hardening Roadmap

Follow-up to [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md), which built the app (Phases 1–28 done). Its two open phases — **29 Performance** and **30 Testing Hardening** — are folded into this roadmap (Phases 39 and 40), so numbering continues at **31**. Once this roadmap is approved, `DEVELOPMENT_PLAN.md` becomes a history file and this is the live tracker (update `CLAUDE.md` in Phase 31).

The image pipeline reuses the one built for the diecast app (`../diecast-collection/scripts/images/` + `src/lib/image-resize.ts`), which was written app-agnostic for this purpose (diecast ROADMAP Phase 21).

**Status: Phase 32 scripts done (2026-10-09); the full image download waits for the egress reset on 2026-10-10.** Research done 2026-10-04 (findings below).

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

**Target after this roadmap:** ≈ 1,426 × (115 KB full + ~28 KB thumb) ≈ **0.2 GB** in the bucket (−86 %); exact sizes are proposed at the start of Phase 33. (Originally estimated as 1,811 × … ≈ 0.26 GB.) The org total drops to ≈ 0.3 GB of 1 GB, and a listing page needs ≈ 0.6 MB.

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

- **Variants:** `full` fits inside 1600×1600, q82 (never enlarges). `thumb` fits inside 600×750, q75: cards are `aspect-[4/5]` and at most ~280 CSS px wide, so 600 px covers 2× screens. Transparency is kept (WebP alpha).
- **Paths:** `{item_type}/{item_id}/{uuid}.webp` and `{uuid}.thumb.webp`. A changed photo always gets a new UUID, so objects are uploaded with `Cache-Control: max-age=31536000, immutable`.
- **Rollback column:** `original_path` keeps the pre-migration object until Phase 37.

## Status

| # | Phase | Status | Needs from owner |
| --- | --- | --- | --- |
| 31 | Security Lockdown | ✅ Done (2026-10-09) | — |
| 32 | Image Audit & Local Backup | 🟡 Scripts done; full backup after 10 Oct | Run `images:backup -- --apply` after the reset (≈ 1.45 GB); copy `backups/` to a second place |
| 33 | Image Pipeline Port & Schema | ⬜ Not started | Apply migration |
| 34 | WebP Migration of Existing Images | ⬜ Not started | Run the scripts with the service-role key |
| 35 | Read Path: Thumbnails Everywhere | ⬜ Not started | — |
| 36 | Upload Path: WebP in the Browser | ⬜ Not started | Upload a test photo by hand |
| 37 | Retire Originals (free the quota) | ⬜ Not started | **Explicit approval to delete ~2 GB of originals** |
| 38 | Static Assets (dashboard hero, icons) | ⬜ Not started | Optional: a better hero source image |
| 39 | Performance Pass (was Phase 29) | ⬜ Not started | — |
| 40 | Testing Hardening (was Phase 30) | ⬜ Not started | Make CI a required check (GitHub setting) |
| 41 | Operations, Docs & Production Verification | ⬜ Not started | `RAWG_API_KEY` in Vercel; go/no-go |

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
- [ ] **Run the full backup after the reset on 10 Oct** (≈ 1.45 GB; this cycle has only ~1.1 GB of egress left)
- [ ] Copy the backup to a second place (external disk / cloud drive) — owner
- [x] Also export the database (Dashboard → Database → Backups is not on Free, so: `pg_dump` with the DB connection string, or a CSV export of every table) and document it in `docs/backup.md`. *`npm run db:export` → JSON per table + checksummed manifest (no `pg_dump` installed; the Docker route is documented). First export 2026-10-09: 15 tables, 1.29 MB*

### Verification
- [x] The audit totals match the findings above (±new uploads): ~1,811 objects, ~2.0 GB, 0 orphans. *1,426 objects / 1.45 GB, 0 orphans — the difference is the owner's deletion of the non-game images on 2026-10-08 (see the update in the findings)*
- [ ] The backup has all 1,426 files; a second run downloads 0 bytes; all sha256 recorded (`--verify` green)
- [ ] Egress used by the backup (≈ 1.45 GB) is noted against the month's budget

### Definition of Done
A verified local copy of every original plus a DB export exists in two places.

---

## Phase 33 — Image Pipeline Port & Schema

### Goal
Bring the diecast WebP converter in, and give `item_images` room for variants. No row changes yet.

### Tasks
- [ ] Copy `scripts/images/` from diecast unchanged (batch, convert, retry, manifest, verify, supabase-target, paths + their tests). Dev dependencies: **`sharp`** (WebP encoding, used by scripts only), **`tsx`** (runs the TS scripts)
- [ ] Add a **local source** option: the job reads originals from `backups/images/` (Phase 32) instead of URLs, so the migration costs no download egress. Keep it generic and send the change back to diecast's copy (or note the divergence in the README)
- [ ] Migration: `item_images` add `thumb_path text null`, `width int null`, `height int null`, `original_path text null`. Recreate `all_items` with `cover_thumb_path` next to `cover_image_path` (a new migration, keeping the column order the app reads). Update `AllItemRow`, `ItemImageRow`, `ItemDetail`
- [ ] `scripts/migrate-images/job.ts`: the games `ImageJob` (bucket `item-images`, `{item_type}/{item_id}/{uuid}.webp` + `.thumb.webp`, variants per the architecture above, `cacheControl` one year)
- [ ] `tsconfig.scripts.json` so `tsc -b` type-checks `scripts/` too; npm scripts `images:migrate`, `images:check`
- [ ] Tests: the copied suites pass; a local-source test; a path-pattern test for every item type

### Verification
- [ ] `npm run images:migrate` (dry run) converts all 1,811 from the local backup and prints the before/after sizes. Expected ≈ 2.0 GB → ≈ 0.26 GB
- [ ] The app works unchanged after the migration (new columns are null, the view still returns everything)

### Definition of Done
A dry run over every image succeeds with zero failures; the schema is ready; no user-visible change.

---

## Phase 34 — WebP Migration of Existing Images

### Goal
Upload WebP variants for every image, verify them, then switch the rows over in one step, with a tested rollback.

### Tasks
- [ ] Owner runs `images:migrate -- --limit=10 --apply`, checks, then the rest. Re-runs resume. **If uploads are blocked by the quota** (Open decision 1), follow the decided plan before continuing
- [ ] `images:check`: `HEAD` every new object (status, type, size vs manifest). Run a `--full` sha256 check on a sample only (~50 objects) to spare egress
- [ ] DB function `set_item_image_variants(jsonb)` (service role only, one transaction): sets `original_path = storage_path`, `storage_path = <full webp>`, `thumb_path`, `width`, `height` for every row. It refuses if any row's current `storage_path` isn't the one recorded in the manifest
- [ ] `images:flip` (dry run by default, `--apply`), and `images:flip -- --rollback --apply` (restores `storage_path` from `original_path` and clears the thumbs)
- [ ] Commit `scripts/migrate-images/manifest.json` as the record

### Verification
- [ ] 1,811/1,811 rows point at WebP; every `storage_path` and `thumb_path` answers 200 `image/webp`
- [ ] Rollback exercised once (flip → rollback → flip), with the app checked after each
- [ ] Spot-check 20 items across all 7 types in the browser (incl. transparent figure/stuff images)

### Definition of Done
Every image row serves WebP; originals are untouched in Storage and backed up locally.

---

## Phase 35 — Read Path: Thumbnails Everywhere

### Goal
Each place loads the smallest image that looks sharp there.

### Tasks
- [ ] `storage.ts`: `getImageUrls(row) → { full, thumb }` (`thumb_path ?? storage_path`); unit-tested
- [ ] `ItemImage` gets `variant: 'thumb' | 'full'` (default `thumb`). **Thumb:** `ItemCard` grid + list, dashboard, recently added, platform pages, search results, related items, DLC section, relationship picker, `ImageManager` tiles, the detail gallery strip, the viewer's thumbnail strip. **Full:** the detail page's main image and the `MediaViewer` stage
- [ ] Pass `width`/`height` to `<img>` where known (avoids layout shift); `decoding="async"`
- [ ] The first visible row of cards (≈ 4–6) loads eager with `fetchpriority="high"` (an LCP candidate); the rest stay lazy (the Settings "image loading" preference still applies)
- [ ] The viewer preloads its neighbours' `full` only

### Verification
- [ ] Network tab: a listing page of 20 cards transfers ≲ 1 MB of images (was ≈ 22 MB); no `full` request until the detail page or viewer
- [ ] Desktop/Tablet/Mobile × both themes: no visible blur on cards on a 2× screen; viewer zoom still sharp
- [ ] Tests for `getImageUrls` and `ItemImage`'s variant choice

### Definition of Done
No list view downloads a full-size image.

---

## Phase 36 — Upload Path: WebP in the Browser

### Goal
New uploads arrive already small, so the bucket never fills up with multi-MB PNGs again.

### Tasks
- [ ] Copy diecast `src/lib/image-resize.ts` (no imports): decode once (EXIF-aware), step-down resize, `OffscreenCanvas` with a canvas fallback, WebP (`png` where a browser can't encode WebP)
- [ ] `uploadItemImage` / `replaceItemImageFile` / `appendItemCoverImage` (RAWG import) produce `full` + `thumb`, upload both (`cacheControl` one year), write `storage_path`, `thumb_path`, `width`, `height`, and clean up both objects on failure
- [ ] Accept JPEG/PNG/WebP/GIF input (GIF → first frame; say so in the UI). Raise the input limit if wanted, since only the output is stored. Update the bucket's `allowed_mime_types` to WebP (+ PNG fallback) only
- [ ] Per-file status in `ImageManager` gains a "Optimising…" step
- [ ] Delete paths remove both variants (and `original_path` if still set)

### Verification
- [ ] Owner uploads a phone photo (~4–8 MB) and a transparent PNG: stored as ~100–200 KB + ~25 KB WebP; the transparency is kept
- [ ] The RAWG cover import stores WebP
- [ ] Unit tests for the resize maths (fit box, never enlarge) and the upload/rollback order (mocked Storage)

### Definition of Done
No new object larger than ~400 KB reaches the bucket.

---

## Phase 37 — Retire Originals (free the quota)

### Goal
Remove the 1,811 original files from Storage once WebP has been live and stable, bringing the org back under 1 GB.

### Tasks
- [ ] Wait period after Phase 35/36 (suggest ≥ 7 days of normal use) with no image regressions reported
- [ ] Re-verify the local backup (sha256 of every file) **in both places** right before deleting
- [ ] `images:prune-originals` (dry run by default, `--apply`): deletes only objects referenced by `original_path` whose row now points at a verified WebP, in batches, then clears `original_path`. Writes a deletion log
- [ ] Document the restore path: re-upload from `backups/images/` + `images:flip -- --rollback` (the rollback now needs the re-upload first)

### Verification
- [ ] The bucket is ≈ 0.26 GB; the org's Usage page shows Storage < 1 GB and uploads allowed
- [ ] Every row still resolves (HEAD 200); the app is checked on each item type

### Definition of Done
Only WebP variants remain in Storage; originals live in the off-Supabase backup.

**Manual:** explicit approval before `--apply`.

---

## Phase 38 — Static Assets

### Goal
Fix the 2.3 MB home page hero and tidy the other static images.

### Tasks
- [ ] `dashboard_cover.png` (2172×724, 2.3 MB) → responsive WebP at ~1200 and ~2200 px wide (expected ~60–150 KB), with AVIF optional. Switch the CSS background to an `<img>` with `srcset`/`sizes`, `object-fit: cover`, `fetchpriority="high"` (it is the dashboard's LCP), keeping the gradient and text backing
- [ ] Generate the assets with a small `scripts/build-static-images.ts` (sharp) so the source stays in the repo and the outputs are reproducible
- [ ] Favicon: add PNG/apple-touch sizes if missing; `manifest.webmanifest` only if PWA is wanted (it is on the "Optional" list)

### Verification
- [ ] The dashboard transfers < 200 KB for the hero; it looks identical at the three breakpoints, both themes

### Definition of Done
No static image over ~200 KB ships in `public/`.

---

## Phase 39 — Performance Pass (was Phase 29)

### Goal
Finish the old Phase 29 with real numbers, now that images are no longer the bottleneck.

### Tasks
- [ ] Lab Web Vitals (LCP, CLS, INP-proxy) for dashboard, a listing page, a detail page and search, on mobile (slow 4G, 4× CPU) and desktop. Option: port diecast's `scripts/perf/vitals.mjs` + `scripts/lib/headless.mjs` (local Edge/Chrome, no new dependency)
- [ ] Query payloads: `all_items` selects only the columns cards use; check `fetchAllRows` users (statistics); indexes for the common filters and sorts (`EXPLAIN` in `supabase/checks/performance.sql`)
- [ ] Duplicate requests and re-renders: one fetch per screen; consider TanStack Query only if measurements show refetch churn (justify the dependency)
- [ ] Bundle: `useSaveItem` chunk (133 kB) and `DatePickerField` (86 kB) only on edit routes; `preconnect` to the Supabase URL in `index.html`
- [ ] Budget written to `docs/performance.md` (e.g. LCP < 2.5 s on mobile, listing ≤ 1 MB of images, initial JS ≤ 170 kB gzip)
- [ ] Large-dataset check: does 427 → ~1,500 items keep listing/search responsive? (Generated rows in a local test only — never in production)

### Verification
- [ ] Before/after table in `docs/performance.md`; the budget is met or the gaps are listed

### Definition of Done
Old Phase 29's DoD: browse, search and detail stay responsive at the expected scale, with numbers recorded.

---

## Phase 40 — Testing Hardening (was Phase 30)

### Goal
Finish the old Phase 30: protect the core flows end to end.

### Tasks
- [ ] Media viewer component test (old 30 leftover)
- [ ] Pull filter/search/duplicate logic out of the Supabase hooks into pure functions and test them (old 30 leftover)
- [ ] Playwright E2E (`@playwright/test`, the locally installed Edge, so no browser download), at Desktop, Tablet and Mobile: browse, filter, search, detail, viewer, settings. **Read-only against production by default**, with a fixture that fails any non-GET to Supabase (diecast pattern), unless the owner sets up a test project (Open decision 3)
- [ ] Owner flows (login, create/edit/delete, image upload, duplicate warning, unsaved-changes guard) only if a test project exists; otherwise document them as a manual checklist in `docs/production-verification.md`
- [ ] CI: add `typecheck` and the image-pipeline tests; E2E as a separate job (optional on PRs)
- [ ] Owner: make the CI check required on `main` (GitHub → Settings → Branches)

### Verification
- [ ] E2E is green 3 runs in a row (no flakes); CI blocks a deliberately broken commit

### Definition of Done
Core public flows are covered by E2E; owner flows by E2E or a documented manual checklist.

---

## Phase 41 — Operations, Docs & Production Verification

### Goal
Close the `DEVELOPMENT_PLAN.md` final checklist and ship it all.

### Tasks
- [ ] `RAWG_API_KEY` set in Vercel (Production + Preview); autofill checked on the deployed site
- [ ] `docs/backup.md`: DB export + image backup procedure, how often, restore steps (the open "backup/recovery" item)
- [ ] README: setup, env, migrations (manual SQL-editor flow), seed, scripts (`images:*`, `verify:rls`), testing, deployment
- [ ] `CLAUDE.md`: image variants, upload pipeline, admin allow-list, scripts
- [ ] Egress/storage watch: a short monthly check in the README (Usage page), or a script that sums the bucket
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
| 3 | E2E: a separate free Supabase test project (allows owner-flow E2E; the org already uses both free slots, so it would go in another org) or read-only E2E against production (the diecast choice)? | Ph 40 |
| 4 | GIF uploads: convert to a still WebP (first frame), or reject GIFs? | Ph 36 |
| 5 | Thumb size 600 px (sharp on 2× screens, ~28 KB est.) vs 400 px (14 KB measured, slightly soft on 2× screens) | Ph 33 |
