# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A personal game/collectibles tracker (games, DLCs/expansions, special editions, steelbooks, artbooks, figures, "stuff") built with React 19 + TypeScript + Vite, Tailwind CSS v4, and Supabase (Postgres + Auth + Storage). Deployed to Vercel via GitHub CI/CD. See `game-details/Games-Website-Context.txt` for the original architecture rationale. `ROADMAP.md` is the live tracker (Phases 31+: security, images, performance, testing, operations) — check its Status table before assuming something is unbuilt, and follow its Workflow rules (one phase at a time, stop for approval). `DEVELOPMENT_PLAN.md` is the history of Phases 1–28 (its open Phases 29/30 continue in `ROADMAP.md` as 39/40).

Key product rules (from `DEVELOPMENT_PLAN.md` Working Rules — do not violate without asking):
- Public visitors can browse the whole collection; only the authenticated owner (single-user admin) can create/update/delete.
- No Wishlist/ownership-status distinction and no pricing/value tracking anywhere — every item is simply owned.
- Every user-facing screen must be implemented/validated at Desktop, Tablet, and Mobile sizes with device-appropriate interaction patterns (not scaled copies).
- Traded/Sold screens, bulk actions, and import/export are intentionally out of scope.

## Commands

```bash
npm run dev       # vite dev server (opens browser)
npm run build     # tsc -b (type-check via project refs) && vite build
npm run lint      # eslint .
npm run format    # prettier --write .
npm run test      # vitest run
```

Run a single test file: `npx vitest run src/features/items/completeness.test.ts`. There is no separate typecheck script — `tsc -b` runs as part of `build`.

Maintenance scripts (plain Node ESM in `scripts/`, run against the live project via `node --env-file-if-exists=.env.local`; pure helpers in `scripts/lib/` have colocated `*.test.mjs` that Vitest picks up): `npm run verify:rls` (anon key + `RLS_*` logins), and `images:audit` / `images:backup` / `db:export`, which need `SUPABASE_SERVICE_ROLE_KEY` and only read. Output goes to git-ignored `backups/` — see `docs/backup.md`. The WebP image pipeline (Phase 33) is TypeScript run by `tsx`: the generic converter in `scripts/images/` (copied from the diecast app, kept in its style and in `.prettierignore`) plus the games job in `scripts/migrate-images/` (`npm run images:migrate` is a dry run by default; it reads originals from `backups/images/` and never downloads them). `tsconfig.scripts.json` makes `tsc -b` type-check `scripts/**/*.ts`. Static images in `public/` (dashboard hero WebPs, `og-image.jpg`, PNG favicons) are generated from `static-src/` by `npm run images:static` (Phase 38) — edit the source and re-run, don't hand-edit the outputs. The org's 5 GB/month egress is shared with another app: anything that downloads the bucket prints its size first and needs `--apply`.

Local Supabase env vars live in `.env.local` (see `.env.local.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. The app throws at import time (`src/lib/supabaseClient.ts`) if these are missing.

Games autofill (Phase 21) uses `RAWG_API_KEY` — server-only, no `VITE_` prefix, so it never reaches the client bundle. It's read by the `/api/*` Vercel serverless functions and, for local dev, by a Vite dev-server middleware in `vite.config.ts` that mounts the same routes. Must also be set in the Vercel project's environment variables for preview/production (as of Phase 23 it was still missing in production, so autofill returns 500 there).

Tests are Vitest: pure-function unit tests (`*.test.ts`) plus component tests (`*.test.tsx`) that opt in to jsdom with a `// @vitest-environment jsdom` docblock and render through `renderWithProviders`/`makeItem` in `src/test/render.tsx` (English locale, router, optional signed-in auth context; Supabase env vars are stubbed in the `test` block of `vite.config.ts`). There is no E2E setup yet. CI (`.github/workflows/ci.yml`, Node 22) runs `npm run lint`, `npm run test`, `npm run build` on pushes to `main` and on PRs, so all three must pass.

## Architecture

**Path alias**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

**Seven item types, one pattern.** `ItemType = 'game' | 'special_edition' | 'steelbook' | 'artbook' | 'figure' | 'stuff' | 'dlc'` (`src/features/items/types.ts`). Each type has its own Supabase table plus a shared set of columns, and the app repeats the same five-route shape per type in `src/App.tsx`: list (`/games`), detail (`/games/:id`), edit (`/games/:id/edit`, auth-gated), plus a shared `/items` (all types) and `/items/new` add flow. When adding a feature to one item type, check whether it needs to be replicated across all seven `*Page.tsx` / `*DetailPage.tsx` / `*EditPage.tsx` files in `src/pages/`.

**Data layer (Supabase)**:
- `src/lib/supabaseClient.ts` — single Supabase client instance.
- `supabase/migrations/` — starts from one baseline, `20260915120000_initial_schema.sql`, that creates the whole current schema in one go (extensions/enums/helpers → lookup tables → the seven per-type item tables incl. `dlcs` → item_images → item_relationships → unified `all_items` view → storage bucket). It replaced the earlier incremental migrations; it is for a *new* database only — the live database already has that schema, so never re-run it there. The `all_items` view (see `AllItemRow` in `features/items/types.ts`) is what backs cross-type listing/search; individual item tables back detail/edit pages via `ItemDetail` (`features/items/detailTypes.ts`), which is a superset of all type-specific columns (unused fields are simply null).
- New schema changes go in new timestamp-named SQL files after the baseline, applied manually to the Supabase project (there is no CLI-driven pipeline in the repo, and local dev points at the same Supabase project as production). `supabase/seed.sql` is idempotent (fixed UUIDs + upserts) and safe to re-run. Schema changes that add columns to item tables usually also require updating the `all_items` view via a new migration, `AllItemRow`, and `ItemDetail`.
- Row Level Security enforces the public-read / owner-write rule described above — do not try to replicate that authorization in the frontend instead of relying on RLS.
- **Admin allow-list** (Phase 31, migration `20261009120000_admin_only_writes.sql`): "owner" means a row in `public.admin_users`, managed in the SQL editor only (RLS on, no API grants). Every write policy — all tables, and Storage `item-images` select/insert/update/delete — is `(select public.is_admin())` (`security definer`, `search_path = ''`); merely being signed in grants nothing. Reads stay public; images load through public URLs, so anon has no Storage `SELECT` and can't list the bucket. Sign-ups are disabled in the dashboard. A new table needs RLS on, a public `select` policy and a `<table>_admin_write` policy of the same shape, plus a case in `scripts/verify-rls.mjs`. `npm run verify:rls` proves the rules against the live project with an admin and a non-admin login (`RLS_*` in `.env.local`); it creates and deletes `ZZ RLS …` / `zz-rls-…` fixtures.

**`src/features/items/`** is the core domain module, organized by concern rather than by item type:
- `api.ts` / `detailApi.ts` / `imageApi.ts` / `relationshipApi.ts` / `deleteApi.ts` / `duplicateApi.ts` — Supabase queries, split by responsibility (listing, detail fetch, image CRUD, related-item links, deletion, duplicate-title detection).
- `useItemListing.ts`, `useFilters.ts`, `useListingPrefs.ts` — listing/filter/sort state for the `*Page.tsx` list views.
- `useItemDetail.ts`, `useItemRelationships.ts`, `useItemImages.ts`, `useDeleteItem.ts` — detail-page data hooks.
- `forms/` — `schemas.ts` (Zod validation), `formState.ts`, `formFields.ts`, `useSaveItem.ts`, `useItemLookups.ts` (platforms/genres for selects) back the shared `ItemForm.tsx` / `EditItemPage.tsx` used by all add/edit routes.
- `detailFields.ts` / `format.ts` / `completeness.ts` — per-type field configuration, display formatting, and the completeness-percentage calculation (has a colocated test: `completeness.test.ts`).
- `components/` — shared UI: `ItemDetailPage.tsx`, `EditItemPage.tsx`, `ItemForm.tsx`, `ImageManager.tsx`, `MediaViewer.tsx`, `RelatedItemsSection.tsx`, `RelationshipPicker.tsx`, `CompletenessBadge.tsx`, `ItemImage.tsx`/`CoverPlaceholder.tsx`.

**Serverless API (`api/`) — RAWG autofill proxy**: `games-search.ts`, `games-details.ts`, `games-image-proxy.ts` are Vercel functions sharing logic in `api/_rawg.ts` (underscore prefix = not deployed as a route). Because `npm run dev` is plain `vite`, `vite.config.ts` re-mounts these same three routes as dev middleware — **adding or changing an `/api` route means updating both the `api/` file and `rawgDevApiPlugin` in `vite.config.ts`**. The image proxy only allows `https://media.rawg.io`. The client side lives in `features/items/gameAutofillApi.ts` and `forms/useGameAutofillSearch.ts`.

**Storage & images**: bucket `item-images`; `features/items/storage.ts` builds plain public URLs (no Supabase image-transform params — responsive sizing is CSS-only by design). Since migration `20261010120000_item_image_variants.sql`, `item_images` also has `thumb_path` (WebP, fits 600×750), `width`/`height` and `original_path` (rollback), and `all_items` has `cover_thumb_path` as its last column. They stay null until the Phase 34 flip. The read path (Phase 35): `ItemImage` takes `storagePath` + `thumbPath` and a `variant` (`thumb` by default, falling back to the full image while a row has no thumb or the thumb fails); only the detail page's main image and the `MediaViewer` stage use `variant="full"`. `getImageUrls`/`imagePathFor`/`imageObjectPaths` in `storage.ts` hold the rules, and image queries select `ITEM_IMAGE_COLUMNS` (`detailApi.ts`). Deleting an image removes every object its row owns. The upload path (Phase 36): `imageApi.ts` converts every picked file (and the RAWG cover import) in the browser with `src/lib/image-resize.ts` (copied from diecast, kept in its style) into `{uuid}.webp` + `{uuid}.thumb.webp`, sized by `IMAGE_VARIANTS` in `features/items/imageVariants.ts` — the single source of truth also imported by the migration job; the bucket only accepts WebP/PNG.

**Deployment**: `vercel.json` rewrites all paths to `index.html` (SPA) and sets security/caching headers.

**Other feature modules**: `src/features/dashboard/` (home summary panel), `src/features/statistics/` (`/statistics` page: `statisticsApi.ts` pages through `all_items`, pure `computeStatistics` in `statistics.ts`, hand-rolled accessible `charts.tsx` — no chart library; use `fetchAllRows` from `items/api.ts` for any unbounded aggregate query, since Supabase caps responses at 1000 rows), `src/features/search/` (global search dialog + panel, recent searches), `src/features/auth/RequireAuth.tsx` (route guard consuming `useAuth`/`AuthProvider`).

**Layout & chrome** (`src/components/layout/`): `AppShell.tsx` wraps all routes; `Sidebar.tsx` (desktop) and `BottomTabBar.tsx`/`MobileNavSheet.tsx` (mobile) both read nav structure from `src/lib/navigation.ts` (`primaryNavItems`, `platformNavItems`, `collectionNavItems`) — add new nav entries there, not by hand in each layout component.

**Auth**: `AuthProvider`/`useAuth` (Supabase session) gate write routes via `RequireAuth`; read routes stay public per the RLS model above.

**i18n**: Custom (no library) — `src/lib/i18n.ts` exports `translate(locale, key, vars?)` over a `Record<Locale, Record<string, string>>` for `sr` (Serbian, primary) and `en`. Every UI string must be added to both locale maps; `TranslationKey` is derived from the `sr` map, so adding a key only to `en` won't type-check against callers. Locale state comes from `LocaleProvider`/`useLocale`. Platform names (proper nouns, in `navigation.ts`) are intentionally left untranslated.

**Settings & theming**: every persisted display preference (theme light/dark, language, default view, default sort, visible platforms, image loading) lives in one validated `settings` localStorage entry owned by `SettingsProvider` (`features/settings/settings.ts` holds the pure parse/load/save logic; read it with `useSettings`). `ThemeProvider`/`useTheme` and `LocaleProvider`/`useLocale` are thin views over it — add new preferences to `Settings`, `DEFAULT_SETTINGS` and `parseSettings` (each field falls back independently) rather than new localStorage keys. Settings are deliberately local-only, not synced to Supabase. `ErrorBoundary` sits outside the providers and reads the language via `loadSettings`.

**Accessibility conventions** (Phase 28 — keep these when adding UI):
- Colour roles in `index.css`: `accent` is for text/borders/rings, `accent-solid` is for *fills* carrying `accent-fg` text (dark-theme `accent` is too light for white text); `danger`/`danger-solid` likewise; `border-input` (not `border-border`) is the border of form controls (3:1). Badge colour maps in `features/items/constants.ts` carry both shades (`text-x-800 dark:text-x-300`); `dark:` is wired to the `.dark` class via `@custom-variant`, not the OS setting.
- Form fields use `Input`/`Textarea`, or for custom triggers `FieldLabel`/`FieldError` (`components/ui/FieldParts.tsx`) plus `useFieldIds`/`triggerA11yProps` (`useFieldIds.ts`) so label, `aria-required` and the error message are attached to the control.
- Dialogs/sheets opened from state must pass `onCloseAutoFocus={restoreFocusOnClose}` (`lib/dialogFocus.ts`; `DialogContent` already does) or focus falls to `<body>` on close.
- Every routed page needs exactly one `<h1>`: `usePageA11y` (in `AppShell`) derives `document.title` and the route announcement from it.
- Icon-only buttons need an accessible name that says *what* (include the item/image), and new strings for that go under `a11y.*` in both locale maps.
- Audit: `scripts/a11y-audit.js` (axe-core + a contrast check) is loaded into a page from the dev server — see its header. Note the Browser pane has no system focus, so scripted `.focus()` fires no `focusin`; test focus behaviour with real clicks/keypresses.

**UI primitives** (`src/components/ui/`): thin wrappers around Radix primitives (`Dialog`, `DropdownMenu`, `Tabs`) plus `Input`, `Textarea`, `Select`, `MultiSelect`, `ConfirmDialog` — prefer these over reaching for Radix directly in feature code.
