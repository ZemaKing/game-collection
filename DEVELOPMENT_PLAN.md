# Game Collection — Development Plan

This file is the live progress tracker for the game-collection site. Update checkboxes only when a task is actually implemented and verified, not merely started.

## Project Status

Current Phase: Phase 1 — Project Foundation
MVP Status: Not Started

## MVP Progress

- [ ] Phase 1 — Project Foundation
- [ ] Phase 2 — Design System & Application Shell
- [ ] Phase 3 — Supabase Project Setup
- [ ] Phase 4 — Core Database Schema & RLS
- [ ] Phase 5 — Seed / Sample Data
- [ ] Phase 6 — Dashboard & Collection Summary
- [ ] Phase 7 — Type Listing Pages
- [ ] Phase 8 — Platform & Status Views
- [ ] Phase 9 — Genres & Tags Filtering
- [ ] Phase 10 — Global Search
- [ ] Phase 11 — Item Detail Page
- [ ] Phase 12 — Storage & Image Galleries
- [ ] Phase 13 — Authentication
- [ ] Phase 14 — Add/Edit Item Form (core)
- [ ] Phase 15 — Image Upload/Replace/Delete
- [ ] Phase 16 — Delete Item & Status Management
- [ ] Phase 17 — Completeness Calculation
- [ ] Phase 18 — RAWG/IGDB Autofill for Games
- [ ] Phase 19 — Deployment & Production Verification
- [ ] MVP Complete

---

## Phase 1 — Project Foundation

### Goal

A running Vite + React + TypeScript scaffold.

### Tasks

- [ ] Scaffold Vite + React + TypeScript project
- [ ] Configure ESLint/Prettier
- [ ] Create folder structure: `src/{components,pages,features,lib,hooks}`
- [ ] Set up React Router with a placeholder route
- [ ] Configure absolute imports

### Database / Supabase

- [ ] N/A for this phase

### UI / UX

- [ ] Blank placeholder page renders

### Testing & Verification

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] App boots locally (`npm run dev`)

### Definition of Done

- [ ] App builds, lints, and runs locally showing a placeholder page

### Out of Scope

Styling, Supabase, routes beyond a placeholder.

### Phase Status

- [ ] Phase Complete

---

## Phase 2 — Design System & Application Shell

### Goal

Dark/light theme tokens and the sidebar/topbar/bottom-tab shell matching the mockups.

### Tasks

- [ ] Configure Tailwind CSS with color/spacing/radius tokens for both themes
- [ ] Build `ThemeProvider` + `localStorage` persistence + `ThemeToggle`
- [ ] Build `AppShell` with static sidebar (Dashboard/All Items/6 types/Platforms/Collection sections as stub links)
- [ ] Build topbar with non-functional search input and avatar placeholder
- [ ] Build mobile bottom tab bar
- [ ] Wire Radix Dialog/DropdownMenu/Tabs with base styles

### Database / Supabase

- [ ] N/A for this phase

### UI / UX

- [ ] Desktop/tablet/mobile shell chrome matches mockups
- [ ] Both light and dark themes render correctly
- [ ] Sidebar collapse behavior on narrow desktop/tablet widths

### Testing & Verification

- [ ] Visual check against mockups at 3 breakpoints
- [ ] Manual theme toggle check

### Definition of Done

- [ ] Shell renders correctly (both themes, 3 breakpoints); nav links are stubs

### Out of Scope

Real data, auth-aware UI.

### Phase Status

- [ ] Phase Complete

---

## Phase 3 — Supabase Project Setup

### Goal

A connected, working Supabase client.

### Tasks

- [ ] Create dedicated Supabase project (dev)
- [ ] Configure `.env.local` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- [ ] Create `src/lib/supabaseClient.ts`
- [ ] Implement a basic connectivity health-check query

### Database / Supabase

- [ ] Supabase project created
- [ ] Anon key retrieved and stored only in env vars

### Testing & Verification

- [ ] Manual: client successfully pings Supabase in dev
- [ ] Missing/invalid env vars fail loudly in dev

### Definition of Done

- [ ] App can execute a trivial Supabase query without error in dev and via Vercel preview env vars

### Out of Scope

Any actual content tables.

### Phase Status

- [ ] Phase Complete

---

## Phase 4 — Core Database Schema & RLS

### Goal

All six item tables plus lookups, the unified view, and RLS are live.

### Tasks

- [ ] Write migrations for `games`, `special_editions`, `steelbooks`, `artbooks`, `figures`, `stuff`
- [ ] Write migrations for `platforms`, `genres`, `tags`, and their join tables (`game_genres`, `special_edition_genres`, `game_tags`, `special_edition_tags`)
- [ ] Write migration for shared `item_images` table (polymorphic `item_type` + `item_id`)
- [ ] Create `all_items` UNION ALL view across the six tables
- [ ] Add `updated_at` triggers on mutable tables
- [ ] Check migrations into `supabase/migrations/`

### Database / Supabase

- [ ] All six item tables created in dev project
- [ ] All lookup/join tables created
- [ ] `item_images` table created
- [ ] `all_items` view created and returns unioned rows
- [ ] RLS enabled on every real table
- [ ] Public SELECT policy on every table
- [ ] Authenticated-only INSERT/UPDATE/DELETE policy on every table

### Testing & Verification

- [ ] Anonymous SELECT succeeds on all tables and the view
- [ ] Anonymous INSERT/UPDATE/DELETE is rejected

### Definition of Done

- [ ] All tables/view created; anonymous SELECT works; anonymous writes rejected

### Out of Scope

Auth user creation, seed data.

### Phase Status

- [ ] Phase Complete

---

## Phase 5 — Seed / Sample Data

### Goal

Realistic sample data across all six item types.

### Tasks

- [ ] Write `supabase/seed.sql` with platforms (PS5, PS4, Steam, Epic Games), a handful of genres and tags
- [ ] Seed sample rows per type (e.g. "007 First Light" game, "Titan Quest II Collector's Edition" special edition, "Bloodborne" steelbook, "The Art of God of War Ragnarök" artbook, "Kratos & Atreus" figure, a "stuff" item)
- [ ] Seed sample `item_images` rows
- [ ] Make seed script idempotent (safely re-runnable)

### Database / Supabase

- [ ] Seed run against dev project only

### Testing & Verification

- [ ] Query seeded tables and `all_items` view to confirm row counts/shape

### Definition of Done

- [ ] Dev database has representative data across all six types and the `all_items` view reflects it

### Out of Scope

Production data entry.

### Phase Status

- [ ] Phase Complete

---
**MVP START**
---

## Phase 6 — Dashboard & Collection Summary

### Goal

The Dashboard screen from the mockup, backed by real seeded data.

### Tasks

- [ ] Build `DashboardPage` using the `all_items` view
- [ ] Build `CollectionSummaryPanel` (counts per type + total est. value)
- [ ] Build `QuickFiltersPanel` (Owned/Wishlist/Recently Added functional; High Value as value-desc preset; Completed/Needs Update wired later in Phase 17)
- [ ] Build unified `ItemGrid` with grid/list view toggle
- [ ] Build `ItemCard`

### Database / Supabase

- [ ] Queries against `all_items` view for grid + summary counts

### UI / UX

- [ ] Desktop dashboard layout matches mockup
- [ ] Mobile condensed version implemented
- [ ] Empty-collection state (`EmptyState`)
- [ ] Missing-cover-image placeholder

### Testing & Verification

- [ ] Component test: `CollectionSummaryPanel` counts accuracy
- [ ] Manual: empty-collection state checked

### Definition of Done

- [ ] Dashboard matches mockup layout at 3 breakpoints using real seeded counts/items

### Out of Scope

Type-specific pages, genre/tag filtering, search.

### Phase Status

- [ ] Phase Complete

---

## Phase 7 — Type Listing Pages

### Goal

The six dedicated listing screens (Games/Special Editions/Steelbooks/Artbooks/Figures/Stuff).

### Tasks

- [ ] Build `GamesPage`, `SpecialEditionsPage`, `SteelbooksPage`, `ArtbooksPage`, `FiguresPage`, `StuffPage`
- [ ] Build shared `FilterBar` parameterized per type (search/filter/sort toolbar)
- [ ] Implement type-appropriate card content (figures show scale, steelbooks show edition, artbooks show publisher)

### Database / Supabase

- [ ] Each page queries its own table directly (not the view)

### UI / UX

- [ ] All six listing pages match their respective mockup layouts
- [ ] Empty-type-collection state handled

### Testing & Verification

- [ ] Component test for one representative type page's filter/sort logic

### Definition of Done

- [ ] All six listing pages match their mockup layouts and filter/sort correctly

### Out of Scope

Item detail, genre/tag filters.

### Phase Status

- [ ] Phase Complete

---

## Phase 8 — Platform & Status Views

### Goal

Sidebar's Platforms and Collection (Wishlist/Traded-Sold/Recently Added) sections.

### Tasks

- [ ] Build `PlatformPage` (cross-type items for a given platform, via `all_items`)
- [ ] Build `WishlistPage`
- [ ] Build `TradedSoldPage`
- [ ] Build full "Recently Added" list page

### Database / Supabase

- [ ] Filtered queries against `all_items` per platform/status

### UI / UX

- [ ] Platform-with-zero-items state handled

### Testing & Verification

- [ ] Manual: filter accuracy check for each view

### Definition of Done

- [ ] All sidebar Platform/Collection links produce correct filtered results

### Out of Scope

Editing the platforms list (seed data defines platforms for MVP).

### Phase Status

- [ ] Phase Complete

---

## Phase 9 — Genres & Tags Filtering

### Goal

Genre panel (with counts) and tag-chip filtering for games/special editions.

### Tasks

- [ ] Build `GenresPanel` wired to real counts, click-to-filter
- [ ] Wire tag-chip filtering within `GamesPage`/`SpecialEditionsPage`

### Database / Supabase

- [ ] Genre count aggregation query
- [ ] Tag-filtered query via `game_tags`/`special_edition_tags`

### Testing & Verification

- [ ] Unit test: genre count aggregation

### Definition of Done

- [ ] Genre and tag filters work correctly against real data

### Out of Scope

Genres/tags for the other four types.

### Phase Status

- [ ] Phase Complete

---

## Phase 10 — Global Search

### Goal

Topbar search across all item types.

### Tasks

- [ ] Implement client-side search over `all_items` (title/platform/edition)
- [ ] Implement `Ctrl+K` focus shortcut

### Testing & Verification

- [ ] Unit test: search matching logic
- [ ] Manual: no-results state

### Definition of Done

- [ ] Search returns correct cross-type results; `Ctrl+K` focuses the field

### Out of Scope

Full command-palette navigation.

### Phase Status

- [ ] Phase Complete

---

## Phase 11 — Item Detail Page

### Goal

The full detail experience for any item type.

### Tasks

- [ ] Build `ItemDetailPage` (route keyed by `item_type` + `id`)
- [ ] Build `ItemDetailHero` (gallery with thumbnail strip + "+N" overflow, title/platform/edition header, action icons)
- [ ] Build `ItemSpecsTable` (fields vary by type)
- [ ] Build description block with expand ("View Full Description")
- [ ] Build `CollectionInfoPanel` (status, added date, value, completeness bar as placeholder until Phase 17)
- [ ] Build `TagList`

### Database / Supabase

- [ ] Single-item fetch per type with joined images/genres/tags

### UI / UX

- [ ] Missing-image placeholder
- [ ] Item-not-found state
- [ ] Type-specific missing fields handled gracefully (e.g. figures have no "Developer")

### Testing & Verification

- [ ] Component test: specs table adapting per type
- [ ] Manual: not-found state checked

### Definition of Done

- [ ] Detail page matches mockup for at least one item of each of the six types

### Out of Scope

Editing, favorite/status persistence (auth arrives later).

### Phase Status

- [ ] Phase Complete

---

## Phase 12 — Storage & Image Galleries

### Goal

Real Storage-backed images across the app.

### Tasks

- [ ] Create `item-images` bucket
- [ ] Update seed data to reference real uploaded sample images
- [ ] Wire `ItemCard`/`ItemDetailHero` gallery to Storage public URLs

### Database / Supabase

- [ ] Public-read bucket policy
- [ ] Authenticated-write bucket policy

### UI / UX

- [ ] Broken/missing image fallback graphic

### Testing & Verification

- [ ] Manual: intentionally broken image path shows fallback

### Definition of Done

- [ ] All sample items across all six types display real Storage images

### Out of Scope

Upload/replace/delete UI.

### Phase Status

- [ ] Phase Complete

---

## Phase 13 — Authentication

### Goal

Admin login with session-gated inline controls (no separate admin shell).

### Tasks

- [ ] Manually create the single admin user in Supabase Auth (dev)
- [ ] Build `LoginPage` (email/password form)
- [ ] Implement session handling via Supabase auth listener
- [ ] Build `useSession` hook that gates Edit/Add/Delete affordances sitewide

### Database / Supabase

- [ ] Supabase Auth email/password configured
- [ ] Session persistence verified

### Testing & Verification

- [ ] Manual: login/logout flow
- [ ] RLS smoke test: authenticated writes succeed post-login

### Definition of Done

- [ ] Logged-in admin sees Edit/Add/Delete controls everywhere they belong; signed-out visitors see a read-only site

### Out of Scope

Actual CRUD forms.

### Phase Status

- [ ] Phase Complete

---

## Phase 14 — Add/Edit Item Form (core)

### Goal

The type-tabbed Add/Edit modal for manual entry.

### Tasks

- [ ] Build `AddEditItemModal` with type tabs (Game/Special Edition/Steelbook/Artbook/Figure/Stuff)
- [ ] Build per-type field components (`GameFields`, `SpecialEditionFields`, `SteelbookFields`, `ArtbookFields`, `FigureFields`, `StuffFields`)
- [ ] Implement Zod validation per type
- [ ] Implement create and edit modes
- [ ] Build `AddEditItemModal` insert/update mutations per table with cache invalidation

### Database / Supabase

- [ ] Authenticated insert/update mutations for each of the six tables

### UI / UX

- [ ] Switching type mid-form resets fields appropriately

### Testing & Verification

- [ ] Component tests: form validation per type
- [ ] Integration test: create → appears in its listing page
- [ ] Manual: edit flow per type

### Definition of Done

- [ ] Admin can create and edit an item of each of the six types via manual entry

### Out of Scope

Image upload, RAWG/IGDB autofill.

### Phase Status

- [ ] Phase Complete

---

## Phase 15 — Image Upload/Replace/Delete

### Goal

Admin can manage item photos.

### Tasks

- [ ] Build `ImageUploader` (drag/drop, up to 10 images, client-side validation + resize)
- [ ] Implement upload → Storage + `item_images` insert
- [ ] Implement replace, delete, reorder, set-primary

### Database / Supabase

- [ ] `item_images` CRUD wired
- [ ] Authenticated Storage write policies exercised

### UI / UX

- [ ] Oversized/wrong-type file rejected client-side with clear message
- [ ] Deleting the primary image auto-promotes another or falls back to placeholder

### Testing & Verification

- [ ] Manual: upload/replace/delete/reorder
- [ ] Verify no orphaned Storage objects after delete

### Definition of Done

- [ ] Admin can fully manage an item's photo gallery; detail/card views reflect changes immediately

### Out of Scope

Orphan-sweep tooling.

### Phase Status

- [ ] Phase Complete

---

## Phase 16 — Delete Item & Status Management

### Goal

Safe deletion and Owned/Wishlist/Traded-Sold status transitions.

### Tasks

- [ ] Build `ConfirmDialog`-backed delete (per-type table row + its `item_images` rows + Storage objects)
- [ ] Build `ItemActionsMenu` quick status toggle (card "…" menu and detail page)

### Database / Supabase

- [ ] Delete mutation per type
- [ ] Status update mutation per type

### Testing & Verification

- [ ] Manual: delete verifies row + image + Storage cleanup
- [ ] Manual: status-change checks
- [ ] Double-submit protection verified

### Definition of Done

- [ ] Admin can delete any item type safely and change its status from card or detail view

### Out of Scope

Bulk actions.

### Phase Status

- [ ] Phase Complete

---

## Phase 17 — Completeness Calculation

### Goal

Wire the "Completed"/"Needs Update" quick filters and the detail-page completeness bar to real computed values.

### Tasks

- [ ] Define per-type "recommended fields" checklist
- [ ] Implement completeness percentage function (client-computed)
- [ ] Wire completeness into `CollectionInfoPanel`
- [ ] Wire Completed/Needs Update into `QuickFiltersPanel`

### Testing & Verification

- [ ] Unit test: completeness function per type

### Definition of Done

- [ ] Completeness bar shows real percentages; Completed/Needs Update filters return correct items

### Out of Scope

Physical CIB tracking.

### Phase Status

- [ ] Phase Complete

---

## Phase 18 — RAWG/IGDB Autofill for Games

### Goal

Optional search-and-autofill for `games`/`special_editions` type tabs.

### Tasks

- [ ] Build minimal Vercel serverless function proxying RAWG/IGDB search (API key server-side only)
- [ ] Build `RawgSearchPanel` in the Game/Special Edition tabs of the Add/Edit modal
- [ ] Implement autofill mapping into form fields (still editable before save)
- [ ] Implement re-upload of fetched cover image into Supabase Storage on save (not hotlinked)
- [ ] Store `rawg_id` for future re-sync/dedupe

### Database / Supabase

- [ ] `rawg_id` column populated on import

### UI / UX

- [ ] API rate-limit/failure falls back to manual entry silently
- [ ] Ambiguous search results let admin pick from a list

### Testing & Verification

- [ ] Manual: search → autofill → edit → save flow
- [ ] Manual: API-failure fallback

### Definition of Done

- [ ] Admin can search RAWG/IGDB, autofill a game/special-edition form, adjust fields, and save with a Storage-hosted cover image

### Out of Scope

Autofill for steelbooks/artbooks/figures/stuff.

### Phase Status

- [ ] Phase Complete

---

## Phase 19 — Deployment & Production Verification

### Goal

The app is live on Vercel against the production Supabase project.

### Tasks

- [ ] Link Vercel project to GitHub repo
- [ ] Provision production Supabase project
- [ ] Run Phase 4 migrations against production (no dev seed data)
- [ ] Set production env vars in Vercel (including RAWG/IGDB key as server-only)
- [ ] Verify preview-deployment flow on a test PR

### Database / Supabase

- [ ] Production RLS re-verified (anon SELECT works, anon writes rejected, authenticated writes succeed)
- [ ] Production Storage bucket + policies created

### Testing & Verification

- [ ] Full manual production smoke test: browse all six types, filter/search, view detail, log in, add/edit/delete an item of each type, upload images, RAWG autofill, toggle theme

### Definition of Done

- [ ] Production URL live, publicly browsable, admin can manage all content, RLS verified in production

### Out of Scope

Custom domain, monitoring/analytics, diecast-site migration.

### Phase Status

- [ ] Phase Complete

---
**MVP COMPLETE**
---

## Phase 20 — Responsive Refinement Pass

### Goal

Systematic breakpoint review beyond the per-phase spot checks.

### Tasks

- [ ] Audit every MVP screen at desktop/tablet/mobile breakpoints, both themes
- [ ] Fix spacing/overflow/touch-target issues

### Testing & Verification

- [ ] Manual full-app breakpoint review

### Definition of Done

- [ ] Full desktop/tablet/mobile checklist pass, both themes

### Phase Status

- [ ] Phase Complete

---

## Phase 21 — Accessibility Pass

### Goal

Address accessibility systematically beyond per-phase basics.

### Tasks

- [ ] Keyboard-navigation audit across all core flows
- [ ] Add focus-visible styles
- [ ] Add `aria` labeling for icon-only buttons/menus
- [ ] Verify dialog focus trapping
- [ ] Color-contrast check in both themes

### Testing & Verification

- [ ] Keyboard-only pass through all core flows
- [ ] Contrast checks pass in both themes

### Definition of Done

- [ ] Keyboard-only pass succeeds; contrast checks pass in both themes

### Phase Status

- [ ] Phase Complete

---

## Phase 22 — Performance Pass

### Goal

Practical performance tuning.

### Tasks

- [ ] Verify image lazy-loading
- [ ] Verify Supabase queries select only needed columns
- [ ] Audit TanStack Query cache keys
- [ ] Bundle-size check

### Testing & Verification

- [ ] Lighthouse/basic bundle check shows no obvious regressions

### Definition of Done

- [ ] No obvious performance regressions

### Phase Status

- [ ] Phase Complete

---

## Phase 23 — Testing Hardening

### Goal

Deepen automated coverage beyond per-phase smoke tests.

### Tasks

- [ ] Set up Playwright
- [ ] E2E: browse → detail per type
- [ ] E2E: search/filters
- [ ] E2E: admin login
- [ ] E2E: add/edit/delete per type
- [ ] E2E: image upload
- [ ] E2E: RAWG/IGDB autofill
- [ ] E2E: RLS rejection of unauthenticated writes

### Testing & Verification

- [ ] E2E suite passes in CI

### Definition of Done

- [ ] E2E suite covers all listed flows and passes in CI

### Phase Status

- [ ] Phase Complete

---

## Phase 24 — Optional / Future Ideas (not scheduled)

Backlog only — not part of MVP or Post-MVP polish. Promote items here to a new phase if the user decides to pursue them:

- [ ] Full command-palette search
- [ ] Physical CIB (complete-in-box) completeness tracking
- [ ] Multi-currency value tracking
- [ ] Bulk import/export
- [ ] Migrate the existing static diecast site into this pattern
- [ ] Barcode/UPC scanning for quick add
- [ ] Genres/tags extended to steelbooks/artbooks/figures/stuff
