# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A personal game/collectibles tracker (games, special editions, steelbooks, artbooks, figures, "stuff") built with React 19 + TypeScript + Vite, Tailwind CSS v4, and Supabase (Postgres + Auth + Storage). Deployed to Vercel via GitHub CI/CD. See `game-details/Games-Website-Context.txt` for the original architecture rationale and `DEVELOPMENT_PLAN.md` for the phase-by-phase build log (also the canonical source of current project status — check "Project Status" / "MVP Progress" there before assuming a feature is unbuilt).

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

Local Supabase env vars live in `.env.local` (see `.env.local.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. The app throws at import time (`src/lib/supabaseClient.ts`) if these are missing.

Games autofill (Phase 21) uses `RAWG_API_KEY` — server-only, no `VITE_` prefix, so it never reaches the client bundle. It's read by the `/api/*` Vercel serverless functions and, for local dev, by a Vite dev-server middleware in `vite.config.ts` that mounts the same routes. Must also be set in the Vercel project's environment variables for preview/production (as of Phase 23 it was still missing in production, so autofill returns 500 there).

Only pure-function unit tests exist (`completeness.test.ts`, `statistics.test.ts`); there is no component/E2E test setup. `tsc -b` type-checks both `src/` (`tsconfig.app.json`) and `api/` + `vite.config.ts` (`tsconfig.node.json`, which uses `erasableSyntaxOnly` — no enums/parameter properties in `api/`).

## Architecture

**Path alias**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

**Six item types, one pattern.** `ItemType = 'game' | 'special_edition' | 'steelbook' | 'artbook' | 'figure' | 'stuff'` (`src/features/items/types.ts`). Each type has its own Supabase table plus a shared set of columns, and the app repeats the same five-route shape per type in `src/App.tsx`: list (`/games`), detail (`/games/:id`), edit (`/games/:id/edit`, auth-gated), plus a shared `/items` (all types) and `/items/new` add flow. When adding a feature to one item type, check whether it needs to be replicated across all six `*Page.tsx` / `*DetailPage.tsx` / `*EditPage.tsx` files in `src/pages/`.

**Data layer (Supabase)**:
- `src/lib/supabaseClient.ts` — single Supabase client instance.
- `supabase/migrations/` — schema history (extensions/helpers → lookup tables → per-type item tables → item_images → item_relationships → unified `all_items` view → storage bucket). The `all_items` view (see `AllItemRow` in `features/items/types.ts`) is what backs cross-type listing/search; individual item tables back detail/edit pages via `ItemDetail` (`features/items/detailTypes.ts`), which is a superset of all type-specific columns (unused fields are simply null).
- Migrations are timestamp-named SQL files, applied manually to the Supabase project (there is no CLI-driven pipeline in the repo, and local dev points at the same Supabase project as production). `supabase/seed.sql` is idempotent (fixed UUIDs + upserts) and safe to re-run. Schema changes that add columns to item tables usually also require updating the `all_items` view via a new migration, `AllItemRow`, and `ItemDetail`.
- Row Level Security enforces the public-read / owner-write rule described above — do not try to replicate that authorization in the frontend instead of relying on RLS.

**`src/features/items/`** is the core domain module, organized by concern rather than by item type:
- `api.ts` / `detailApi.ts` / `imageApi.ts` / `relationshipApi.ts` / `deleteApi.ts` / `duplicateApi.ts` — Supabase queries, split by responsibility (listing, detail fetch, image CRUD, related-item links, deletion, duplicate-title detection).
- `useItemListing.ts`, `useFilters.ts`, `useListingPrefs.ts` — listing/filter/sort state for the `*Page.tsx` list views.
- `useItemDetail.ts`, `useItemRelationships.ts`, `useItemImages.ts`, `useDeleteItem.ts` — detail-page data hooks.
- `forms/` — `schemas.ts` (Zod validation), `formState.ts`, `formFields.ts`, `useSaveItem.ts`, `useItemLookups.ts` (platforms/genres for selects) back the shared `ItemForm.tsx` / `EditItemPage.tsx` used by all add/edit routes.
- `detailFields.ts` / `format.ts` / `completeness.ts` — per-type field configuration, display formatting, and the completeness-percentage calculation (has a colocated test: `completeness.test.ts`).
- `components/` — shared UI: `ItemDetailPage.tsx`, `EditItemPage.tsx`, `ItemForm.tsx`, `ImageManager.tsx`, `MediaViewer.tsx`, `RelatedItemsSection.tsx`, `RelationshipPicker.tsx`, `CompletenessBadge.tsx`, `ItemImage.tsx`/`CoverPlaceholder.tsx`.

**Serverless API (`api/`) — RAWG autofill proxy**: `games-search.ts`, `games-details.ts`, `games-image-proxy.ts` are Vercel functions sharing logic in `api/_rawg.ts` (underscore prefix = not deployed as a route). Because `npm run dev` is plain `vite`, `vite.config.ts` re-mounts these same three routes as dev middleware — **adding or changing an `/api` route means updating both the `api/` file and `rawgDevApiPlugin` in `vite.config.ts`**. The image proxy only allows `https://media.rawg.io`. The client side lives in `features/items/gameAutofillApi.ts` and `forms/useGameAutofillSearch.ts`.

**Storage & images**: bucket `item-images`; `features/items/storage.ts` builds plain public URLs (no Supabase image-transform params — responsive sizing is CSS-only by design).

**Deployment**: `vercel.json` rewrites all paths to `index.html` (SPA) and sets security/caching headers.

**Other feature modules**: `src/features/dashboard/` (home summary panel), `src/features/statistics/` (`/statistics` page: `statisticsApi.ts` pages through `all_items`, pure `computeStatistics` in `statistics.ts`, hand-rolled accessible `charts.tsx` — no chart library; use `fetchAllRows` from `items/api.ts` for any unbounded aggregate query, since Supabase caps responses at 1000 rows), `src/features/search/` (global search dialog + panel, recent searches), `src/features/auth/RequireAuth.tsx` (route guard consuming `useAuth`/`AuthProvider`).

**Layout & chrome** (`src/components/layout/`): `AppShell.tsx` wraps all routes; `Sidebar.tsx` (desktop) and `BottomTabBar.tsx`/`MobileNavSheet.tsx` (mobile) both read nav structure from `src/lib/navigation.ts` (`primaryNavItems`, `platformNavItems`, `collectionNavItems`) — add new nav entries there, not by hand in each layout component.

**Auth**: `AuthProvider`/`useAuth` (Supabase session) gate write routes via `RequireAuth`; read routes stay public per the RLS model above.

**i18n**: Custom (no library) — `src/lib/i18n.ts` exports `translate(locale, key, vars?)` over a `Record<Locale, Record<string, string>>` for `sr` (Serbian, primary) and `en`. Every UI string must be added to both locale maps; `TranslationKey` is derived from the `sr` map, so adding a key only to `en` won't type-check against callers. Locale state comes from `LocaleProvider`/`useLocale`. Platform names (proper nouns, in `navigation.ts`) are intentionally left untranslated.

**Theming**: `ThemeProvider`/`useTheme` + `ThemeToggle` support light/dark/system, alongside `LocaleProvider`/`LocaleToggle` for sr/en — both are top-level providers wrapping the app in `main.tsx`.

**UI primitives** (`src/components/ui/`): thin wrappers around Radix primitives (`Dialog`, `DropdownMenu`, `Tabs`) plus `Input`, `Textarea`, `Select`, `MultiSelect`, `ConfirmDialog` — prefer these over reaching for Radix directly in feature code.
