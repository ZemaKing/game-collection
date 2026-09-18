# Game Collection — Development Plan

This file is the live progress tracker for the game-collection site. Update checkboxes only when a task is actually implemented and verified, not merely started.

## Working Rules

- Keep this document synchronized with implementation progress.
- Do not mark a task complete until it is implemented and verified.
- Implement and validate every user-facing screen at Desktop, Tablet, and Mobile sizes.
- Desktop, Tablet, and Mobile must use device-appropriate interaction patterns; they must not be simple scaled copies.
- Preserve the visual language established by the approved game-collection mockups.
- Public visitors can browse the collection. Only the authenticated owner can create, update, or delete data.
- This is a personal collection tracker: every item is simply owned. There is no Wishlist/ownership-status distinction and no pricing/value tracking anywhere in the app.
- Traded/Sold screens, Wishlist, pricing, bulk actions, and import/export are intentionally excluded.

## Project Status

Current Phase: Phase 20 — Completeness Calculation  
MVP Status: In Progress

## MVP Progress

- [x] Phase 1 — Project Foundation
- [x] Phase 2 — Design System & Application Shell
- [x] Phase 3 — Supabase Project Setup
- [x] Phase 4 — Core Database Schema & RLS
- [x] Phase 5 — Seed / Sample Data
- [x] Phase 6 — Dashboard & Collection Summary
- [x] Phase 7 — All Items & Type Listing Pages
- [x] Phase 8 — Grid and List Views
- [x] Phase 9 — Platform & Recently Added Views
- [x] Phase 10 — Global Search
- [x] Phase 11 — Advanced Filters & Sort
- [x] Phase 12 — Item Detail Pages
- [x] Phase 13 — Special Edition Details & Item Relationships
- [x] Phase 14 — Storage, Galleries & Media Viewer
- [x] Phase 15 — Authentication
- [x] Phase 16 — Add/Edit Item CRUD
- [x] Phase 17 — Image Management CRUD
- [x] Phase 18 — Delete Management
- [x] Phase 19 — Duplicate Detection & Unsaved Changes Guard
- [ ] Phase 20 — Completeness Calculation
- [ ] Phase 21 — RAWG/IGDB Autofill for Games
- [ ] Phase 22 — Empty, Loading, Error & No Results States
- [ ] Phase 23 — Deployment & Production Verification
- [ ] MVP Complete

## Post-MVP Progress

- [ ] Phase 24 — Statistics & Collection Insights
- [ ] Phase 25 — Settings & Preferences
- [ ] Phase 26 — Profile & Collection Overview
- [ ] Phase 27 — Responsive Refinement Pass
- [ ] Phase 28 — Accessibility Pass
- [ ] Phase 29 — Performance Pass
- [ ] Phase 30 — Testing Hardening

---

## Phase 1 — Project Foundation

### Goal

A running Vite + React + TypeScript scaffold.

### Tasks

- [x] Scaffold Vite + React + TypeScript project
- [x] Configure ESLint/Prettier
- [x] Create folder structure: `src/{components,pages,features,lib,hooks}`
- [x] Set up React Router with a placeholder route
- [x] Configure absolute imports

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] Blank placeholder page renders

### Testing & Verification

- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] App boots locally (`npm run dev`)

### Definition of Done

- [x] App builds, lints, and runs locally showing a placeholder page

### Out of Scope

Styling, Supabase, routes beyond a placeholder.

### Phase Status

- [x] Phase Complete

---

## Phase 2 — Design System & Application Shell

### Goal

Dark/light theme tokens and the sidebar/topbar/bottom-tab shell matching the mockups.

### Tasks

- [x] Configure Tailwind CSS with color/spacing/radius tokens for both themes
- [x] Build `ThemeProvider` + `localStorage` persistence + `ThemeToggle`
- [x] Build `AppShell` with static sidebar (Dashboard/All Items/6 types/Platforms/Collection sections as stub links)
- [x] Build topbar with non-functional search input and avatar placeholder
- [x] Build mobile bottom tab bar
- [x] Wire Radix Dialog/DropdownMenu/Tabs with base styles

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] Desktop/tablet/mobile shell chrome matches mockups
- [x] Both light and dark themes render correctly
- [x] Sidebar collapse behavior on narrow desktop/tablet widths

### Testing & Verification

- [x] Visual check against mockups at 3 breakpoints
- [x] Manual theme toggle check

### Definition of Done

- [x] Shell renders correctly (both themes, 3 breakpoints); nav links are stubs

### Out of Scope

Real data, auth-aware UI.

### Phase Status

- [x] Phase Complete

---

## Phase 3 — Supabase Project Setup

### Goal

A connected, working Supabase client.

### Tasks

- [x] Create dedicated Supabase project (dev)
- [x] Configure `.env.local` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- [x] Create `src/lib/supabaseClient.ts`
- [x] Implement a basic connectivity health-check query

### Database / Supabase

- [x] Supabase project created
- [x] Anon key retrieved and stored only in env vars

### Testing & Verification

- [x] Manual: client successfully pings Supabase in dev
- [x] Missing/invalid env vars fail loudly in dev

### Definition of Done

- [x] App can execute a trivial Supabase query without error in dev and via Vercel preview env vars

### Out of Scope

Any actual content tables.

### Phase Status

- [x] Phase Complete

---

## Phase 4 — Core Database Schema & RLS

### Goal

All six item tables, lookups, relationships, unified view, and RLS are live.

### Tasks

- [x] Write migrations for `games`, `special_editions`, `steelbooks`, `artbooks`, `figures`, `stuff`
- [x] Add shared ownership fields (collection date, condition, notes) where applicable — `status`/`value`/`currency` were added here and dropped in Phase 9 (no Wishlist or pricing in this app; see that phase)
- [x] Write migrations for `platforms`, `genres`, `tags`, and required join tables
- [x] Write migration for shared `item_images` table (`item_type`, `item_id`, position, cover flag, alt text)
- [x] Create `item_relationships` table for parent/child and related collection items
- [x] Create `all_items` UNION ALL view with a normalized result shape
- [x] Add indexes for search, filters, dates, status, type, and platform
- [x] Add `updated_at` triggers on mutable tables
- [x] Check migrations into `supabase/migrations/`

### Database / Supabase

- [x] All six item tables and lookup/join tables created
- [x] `item_images`, `item_relationships`, and `all_items` created
- [x] RLS enabled on every real table
- [x] Public SELECT policies enabled
- [x] Authenticated-owner INSERT/UPDATE/DELETE policies enabled

### Testing & Verification

- [x] Anonymous SELECT succeeds on all public data
- [x] Anonymous writes are rejected
- [x] Authenticated owner CRUD succeeds — verified live via `scripts/verify-phase4-rls.mjs`: owner sign-in, INSERT, UPDATE, and DELETE on `games` all succeeded (9/9 checks passed)
- [x] Relationship constraints prevent invalid or orphaned references — verified live: self-reference rejected by `item_relationships_no_self_reference`, dangling reference rejected by `validate_item_relationships_reference` trigger, duplicate rejected by `item_relationships_unique_link`

### Definition of Done

- [x] Schema supports all planned collection, search, filtering, CRUD, gallery, and relationship flows

### Out of Scope

Auth user creation, UI, production data entry.

### Phase Status

- [x] Phase Complete

---

## Phase 5 — Seed / Sample Data

### Goal

Realistic, reusable sample data across all item types and planned UI states.

### Tasks

- [x] Seed platforms, genres, tags, and conditions
- [x] Seed several rows for each of the six item types
- [x] Seed special-edition contents and cross-item relationships
- [x] Seed cover images and gallery images
- [x] Seed records that exercise search, filters, duplicate detection, completeness, and recent activity — added a `created_at = now()` row (`Stray`) so Recently Added's "Today" bucket has data; prior rows only covered Yesterday and older
- [x] Make `supabase/seed.sql` idempotent

### Testing & Verification

- [x] Verify table counts and normalized `all_items` output
- [x] Verify every listing/detail/state mockup has representative data — spot-checked live against dev: Dashboard, Recently Added ("Today"/Yesterday/older groups), All Items, all six type pages, platform pages (PS5/PS4/Steam/Epic populated, Xbox empty-state), search, filters, special-edition Base Game/Contents detail, and missing-image fallback all render correctly

### Definition of Done

- [x] Dev data supports every MVP screen without hard-coded page content

### Phase Status

- [x] Phase Complete

---

**MVP START**

---

## Phase 6 — Dashboard & Collection Summary

### Goal

Build the primary dashboard from live unified collection data.

### Tasks

- [x] Build responsive dashboard route
- [x] Query paginated `all_items` data
- [x] Build collection summary totals by item type
- [x] Build genre summary and recently added panel
- [x] Connect platform/type filter controls
- [x] Persist selected sort and view preferences locally until Settings exists

### UI / UX

- [x] Match approved Desktop dashboard composition
- [x] Tablet uses collapsed icon sidebar and compact summary treatment
- [x] Mobile uses bottom navigation, compact filters, and card grid
- [x] Hide owner-only Add/Edit actions for public visitors

### Testing & Verification

- [x] Summary counts match database results
- [x] Filters and sorting update results correctly
- [x] Verify Desktop, Tablet, and Mobile layouts

### Definition of Done

- [x] Dashboard renders live collection data and matches approved responsive mockups

### Phase Status

- [x] Phase Complete

---

## Phase 7 — All Items & Type Listing Pages

### Goal

Provide a unified collection and dedicated pages for all six item types.

### Tasks

- [x] Build `AllItemsPage`
- [x] Build Games, Special Editions, Steelbooks, Artbooks, Figures, and Stuff pages
- [x] Reuse normalized card/list components with type-specific metadata
- [x] Add pagination or incremental loading
- [x] Add item-type labels/icons on mixed All Items results
- [x] Connect item cards/rows to detail routes

### UI / UX

- [x] Mixed collection remains visually consistent without hiding item type
- [x] Desktop uses full toolbar and dense content area
- [x] Tablet uses compact toolbar and collapsible navigation
- [x] Mobile uses stacked controls and touch-friendly cards/list rows

### Testing & Verification

- [x] Each page returns only expected types
- [x] All Items correctly mixes and labels all types
- [x] Deep links and browser navigation work

### Definition of Done

- [x] All unified and type-specific collection routes work at all three device sizes

### Phase Status

- [x] Phase Complete

---

## Phase 8 — Grid and List Views

### Goal

Make the existing Grid/List toggle fully functional for every listing surface.

### Tasks

- [x] Build reusable responsive grid cards
- [x] Build reusable desktop/tablet list rows
- [x] Define compact mobile list rows rather than shrinking the desktop table
- [x] Keep filters, sort, pagination, and selection state when switching views
- [x] Persist view preference per listing or globally
- [x] Define visible metadata and actions for each item type in both views

### UI / UX

- [x] Grid and List match the approved visual system
- [x] Long titles and missing images degrade gracefully
- [x] Hover actions have keyboard and touch equivalents

### Testing & Verification

- [x] View switching does not refetch unnecessarily or lose state
- [x] Verify representative item types in both views on all devices

### Definition of Done

- [x] Every collection listing has production-ready Grid and List modes

### Phase Status

- [x] Phase Complete

---

## Phase 9 — Platform & Recently Added Views

### Goal

Complete sidebar destinations for platform and recent collection activity.

### Tasks

- [x] Build platform-filtered routes for PS5, PS4, Steam, Epic Games, and Xbox (Xbox added post-hoc, same phase)
- [x] Build `RecentlyAddedPage` as a chronological activity/list view
- [x] Include created activity derived from `created_at` (documented subset — no separate audit table; see below)
- [x] Remove Traded/Sold as a standalone screen and navigation destination
- [x] Remove Wishlist as a standalone screen and navigation destination — this is an owned-only personal collection tracker (see Working Rules); dropped the `status` column, `item_status` enum, and `value`/`currency` fields added in Phase 4, and the Wishlist nav/bottom-tab entries added in Phase 2

### Database / Supabase

- [x] Drop `status`/`value`/`currency` from all six item tables and the `item_status` enum; recreate `all_items` without them (migration `20260915130000_drop_status_and_pricing.sql`)
- [x] Derive Recently Added from `created_at` only, documented in code — a real audit table is unnecessary while no CRUD exists yet (Phases 16-18); revisit once edits are possible

### UI / UX

- [x] Recently Added uses readable date grouping (Today / Yesterday / full date) and activity labels
- [x] Mobile actions use menus or sheets rather than hover-only controls — N/A this phase: no owner actions are rendered pre-Phase 15, consistent with Phase 6

### Testing & Verification

- [x] Platform filters return correct items
- [x] Activity order and date grouping are correct

### Definition of Done

- [x] Platform and Recently Added destinations are complete and responsive

### Phase Status

- [x] Phase Complete

---

## Phase 10 — Global Search

### Goal

Search the whole collection quickly across all item types.

### Tasks

- [x] Implement normalized search over title, edition, platform, developer/publisher/manufacturer, genre, and tags
- [x] Build grouped search results by item type
- [x] Build recent searches with clear/remove actions
- [x] Add keyboard shortcut and keyboard navigation on Desktop
- [x] Build mobile full-screen search overlay
- [x] Highlight matched text where useful
- [x] Add clear, loading, no-results, and error behavior

### Testing & Verification

- [x] Search is debounced and stale responses cannot overwrite newer results
- [x] Keyboard, touch, and browser-back behavior work
- [x] Special characters and empty queries are handled safely

### Definition of Done

- [x] Global Search works across all collection types on Desktop, Tablet, and Mobile

### Phase Status

- [x] Phase Complete

---

## Phase 11 — Advanced Filters & Sort

### Goal

Provide a complete, reusable filtering and sorting experience.

### Tasks

- [x] Filter by platform, item type, genre, release year, collection date, condition, and tags
- [x] Support multi-select where appropriate
- [x] Add active-filter chips and count
- [x] Add `Clear All`, cancel, and apply behavior
- [x] Synchronize applicable filters with URL query parameters
- [x] Support sort by recently added, title, release date, and last updated

### UI / UX

- [x] Desktop uses popover or side panel without obscuring results unnecessarily
- [x] Tablet uses compact drawer/panel
- [x] Mobile uses full-screen sheet with sticky Clear/Apply actions
- [x] Zero-result combinations link directly to clearing filters

### Testing & Verification

- [x] Filter combinations return correct results
- [x] Refresh and shared URLs restore state
- [x] Cancel does not apply draft changes

### Definition of Done

- [x] All listing pages (Dashboard, All Items, per-type, per-platform) share one consistent responsive filter/sort system. Global Search (Phase 10) intentionally keeps its own lightweight relevance-based UX rather than adopting facet filters — different job (find one item fast vs. browse/narrow a list).

### Phase Status

- [x] Phase Complete

---

## Phase 12 — Item Detail Pages

### Goal

Create complete read-only detail experiences for every item type.

### Tasks

- [x] Build typed item-detail route and data loader (`games/:id`, `special-editions/:id`, `steelbooks/:id`, `artbooks/:id`, `figures/:id`, `stuff/:id`, each querying its own table — not the normalized `all_items` view — for full type-specific columns)
- [x] Build shared detail shell plus type-specific field sections (`DETAIL_FIELDS` config per item type)
- [x] Show dates, condition, identifiers, description, notes, tags, and metadata where applicable
- [x] Add owner-only Edit/Delete controls — N/A this phase: no owner actions are rendered pre-Phase 15, consistent with Phase 6/9
- [x] Add gallery thumbnail strip
- [x] Add missing-item and invalid-route behavior (nonexistent id and malformed/non-UUID id both resolve to the same not-found state)

### UI / UX

- [x] Desktop uses cover, metadata, description, and collection-info panels
- [x] Tablet reorganizes content without hiding primary data (single-column stack with a 2-column metadata grid, vs. mobile's single-column metadata list)
- [x] Mobile prioritizes cover, title, essential metadata, and expandable description (Read More/Read Less only rendered when the description actually overflows 3 lines)

### Testing & Verification

- [x] All six item types render their correct fields
- [x] Public/owner permissions render correct actions
- [x] Direct navigation and refresh work

### Definition of Done

- [x] Every collection item has a complete responsive detail page

### Phase Status

- [x] Phase Complete

---

## Phase 13 — Special Edition Details & Item Relationships

### Goal

Represent collector editions and related physical/digital items as connected collection objects.

### Tasks

- [x] Build Special Edition detail composition (dedicated "Base Game" + "Contents" sections, vs. one generic "Related Items" section for the other five types)
- [x] Show base game and edition contents (steelbook, artbook, figure, or any other linked item — not limited to a fixed content type list)
- [x] Build reusable Related Items section (`RelatedItemsSection`, shared by all six detail pages via `ItemCard`)
- [x] Support relationships such as Game → Special Edition → Steelbook/Artbook/Figure
- [x] Add owner-only link/unlink item controls — N/A this phase: no owner actions are rendered pre-Phase 15, consistent with Phase 6/9/12
- [x] Prevent circular, duplicate, and invalid relationships — enforced at the database level since Phase 4 (`item_relationships_no_self_reference` check, `item_relationships_unique_link` unique constraint, `validate_item_relationships_reference` trigger); the read-side only ever walks one hop in each direction, so it can't infinite-loop even on a future multi-hop cycle

### UI / UX

- [x] Relationships are understandable as cards/list rather than a technical graph
- [x] Desktop, Tablet, and Mobile layouts preserve hierarchy and tap targets

### Testing & Verification

- [x] Linked items navigate correctly in both directions
- [x] Deleted items cannot leave broken relationship UI (relationship rows are cascade-deleted with their item, and the fetch silently drops any reference that doesn't resolve)

### Definition of Done

- [x] Special editions clearly expose their contents and related collection objects

### Phase Status

- [x] Phase Complete

---

## Phase 14 — Storage, Galleries & Media Viewer

### Goal

Deliver fast cover/gallery images and an immersive viewer.

### Tasks

- [x] Create Supabase Storage bucket and policies — migration `20260917140000_item_images_storage_bucket.sql` applied; verified live with the anon key (public read succeeds, anon write rejected with "new row violates row-level security policy")
- [x] Build image URL helpers and responsive image variants — `getImagePublicUrl()`; "responsive" via CSS (`aspect-ratio` + `object-fit: cover`), not server-resized variants (Supabase's image-transform query params need a paid add-on that isn't guaranteed enabled — safer to not depend on it)
- [x] Load cover plus ordered gallery thumbnails
- [x] Build full-screen Media Viewer with previous/next, thumbnails, zoom, and close
- [x] Support keyboard navigation and swipe gestures
- [x] Add image count, loading, error, and fallback states

### UI / UX

- [x] Desktop viewer supports keyboard and large preview
- [x] Tablet viewer supports touch and compact thumbnails
- [x] Mobile viewer uses edge-to-edge media and gesture-safe controls

### Testing & Verification

- [x] Public can view images but cannot modify Storage — verified live: anon `list`/public URL fetch succeed, anon `upload` rejected by RLS
- [x] Viewer works with one image, many images, and failed images — verified via headless browser (index/count/thumbnails/prev-next all correct at 1 and 3 images); "failed" is every image right now since no real files have been uploaded to the bucket yet, so the fallback path is thoroughly exercised — real photos are a data step for whenever the owner (or Phase 16/17 CRUD) uploads them, not a code gap

### Definition of Done

- [x] Item galleries and Media Viewer are complete across all devices

### Phase Status

- [x] Phase Complete

---

## Phase 15 — Authentication

### Goal

Public browsing with secure owner-only administration.

### Tasks

- [x] Configure Supabase Auth for a single owner/admin account — owner account created via the Supabase Dashboard; no public sign-up form exists in the app (intentionally — single-owner site)
- [x] Build login/logout flow and session restoration (`AuthProvider` mirrors `supabase.auth` session state via `getSession()` + `onAuthStateChange`; session persistence/refresh is supabase-js's default client behavior)
- [x] Protect Add/Edit/Delete routes and controls (`RequireAuth` route guard; applied to `/items/new`, the only such route that exists yet — Phase 16-18 will add the rest under the same guard; the Sidebar/bottom-tab "Add New Item" stub is now hidden unless signed in)
- [x] Keep all read-only routes public (unchanged — `RequireAuth` wraps only `/items/new`)
- [x] Handle expired sessions and unauthorized deep links (`RequireAuth` redirects to `/login` with the intended destination preserved in router state; verified a direct visit to `/items/new` while logged out redirects correctly)

### Testing & Verification

- [x] Anonymous visitor can browse but cannot write (write UI is hidden; RLS backs this up independently, verified since Phase 4/14)
- [x] Owner can authenticate and access CRUD — owner confirmed signing in shows the account dropdown with Sign Out, and `/items/new` renders the protected placeholder instead of redirecting
- [x] Client UI and RLS independently enforce permissions (`RequireAuth`/hidden buttons at the UI layer, `to authenticated` RLS policies at the DB layer — verified both anonymous- and owner-side)

### Definition of Done

- [x] Authentication and authorization are secure and predictable

### Phase Status

- [x] Phase Complete

---

## Phase 16 — Add/Edit Item CRUD

### Goal

Create and update all six item types with responsive, validated forms.

### Tasks

- [x] Build type selector for Game, Special Edition, Steelbook, Artbook, Figure, and Stuff (`TypeSelector.tsx`, shown at `/items/new` before a type is chosen)
- [x] Build shared fields and per-type form schemas (`forms/formFields.ts` `FORM_SECTIONS`, `forms/schemas.ts` zod schemas — hand-rolled `useState` + `safeParse`, matching the `recipe-collection` sibling project's pattern rather than adding react-hook-form)
- [x] Implement create and edit mutations (`forms/useSaveItem.ts`; `AddItemPage.tsx` / `EditItemPage.tsx`)
- [x] Validate required fields, dates, numeric values, and conditional fields (zod schemas per type; `title` required, numeric fields mirror DB `check` constraints)
- [x] Add tags, genres, platform, condition, and relationship inputs — `status` intentionally excluded (removed in Phase 9; no Wishlist/pricing in this app, see Working Rules); genres are games-only, matching the existing `game_genres` schema (no new join table added)
- [x] Preserve draft values when moving between steps (`ItemForm.tsx` — one `useState` instance drives every step/section; nothing resets on step change)
- [x] Show clear saving, success, and failure feedback (submit button shows a saving label and disables; failures render an inline error banner; success navigates to the item's detail page)

### UI / UX

- [x] Desktop uses modal or wide panel consistent with mockups — implemented as a full-page route styled as a wide panel rather than a JS overlay-modal (confirmed with the owner during planning; no changes needed to the existing Sidebar/BottomTabBar `/items/new` links)
- [x] Tablet uses compact step/panel layout
- [x] Mobile uses full-screen multi-step flow with sticky actions (progress bar + Back/Next/Save sticky bottom bar)
- [x] Forms remain usable with the virtual keyboard open

### Testing & Verification

- [x] Create and edit each item type — verified live by the owner across all six types
- [x] Validation blocks invalid submission and focuses the first error
- [x] Public visitor cannot access form routes or mutations — verified anonymous visits to `/items/new` redirect to `/login`; RLS already enforced independently since Phase 4/15

### Definition of Done

- [x] Owner can reliably create and edit every item type on every device

### Phase Status

- [x] Phase Complete

---

## Phase 17 — Image Management CRUD

### Goal

Add owner-only upload, reorder, cover selection, replacement, and deletion.

### Tasks

- [x] Upload one or multiple images with progress — per-file Queued/Uploading/Done/Failed status (`useItemImages.ts` upload queue), not byte-level percentage: `@supabase/storage-js` has no `onUploadProgress` hook, and a hand-rolled `XMLHttpRequest` against the Storage REST endpoint was judged not worth the added complexity for a single-owner app (confirmed with the owner during planning)
- [x] Validate file type, file size, and image count (`imageApi.ts` `validateFiles()` mirrors the bucket's own limits — MIME allowlist, 10 MB, and a client-chosen cap of 20 images/item — client-side, before any network call)
- [x] Reorder gallery images (hand-rolled Up/Down buttons per image, no drag-and-drop library — confirmed with the owner during planning; `reorderItemImages()` persists the full new position order)
- [x] Set any image as cover (`setCoverImage()` unsets the old cover before setting the new one — required by the `item_images_one_cover_per_item` partial unique index)
- [x] Replace an existing image (`replaceItemImageFile()` uploads the new file, updates the row, then deletes the old object only after the DB update succeeds)
- [x] Delete an image with confirmation (`ConfirmDialog.tsx`, new reusable Radix-Dialog-based component — also intended for Phase 18's delete-item confirmation)
- [x] Add/edit alt text (`updateImageAltText()`, saved on blur)
- [x] Roll back database/storage changes on partial failure — manual compensating actions per mutation (matches the codebase's existing no-transaction, sequential-`await` style in `useSaveItem.ts`; no Postgres RPC/transaction used): a failed DB insert after a successful upload deletes the just-uploaded object, and a failed replace-update deletes the newly-uploaded object rather than the original

### UI / UX

- [x] Desktop supports drag-and-drop plus file picker (`ImageManager.tsx` drop zone + hidden file input, both feeding the same `addFiles()`)
- [x] Tablet/mobile support picker, camera/gallery source where available, and touch reordering — same file input/dropzone (native HTML5 drag events don't fire on touch, so touch users use the picker), reordering via the same Up/Down buttons (touch-friendly tap targets, no drag gesture)
- [x] Destructive actions require explicit confirmation (image delete goes through `ConfirmDialog`)

### Testing & Verification

- [x] Storage and database remain synchronized — verified live: replace leaves exactly one object per row, delete removes both the object and the row
- [x] Unauthorized uploads and deletes fail — verified live: signed-out visit to `/games/:id/edit` redirects to `/login`; the Images step only renders inside the already `RequireAuth`-guarded edit route (no separate route added — the Images step is gated by `ItemForm`'s `excludeId` prop, only passed by `EditItemPage`, never by the create flow)
- [x] Cover fallback remains valid after deletion — verified live: deleting the current cover image with another image present promotes the remaining lowest-position image to cover

### Definition of Done

- [x] Owner can fully manage item images without orphaned files or rows — verified live end-to-end via a headless-browser pass: upload (valid + multi-file), reject invalid type, set cover, reorder, replace, alt text, delete-with-cover-fallback, and persistence across reload all confirmed with screenshots; `npm run build` and `npm run lint` pass

### Out of Scope

The Images step only exists once an item has a real id (create flow has none yet — `item_images` rows require it), so it's edit-only, matching the "inline in edit form" entry point confirmed with the owner during planning. Storage cleanup when an *item* itself is deleted is Phase 18's responsibility (no FK cascade exists from item tables to `item_images`, by design since Phase 4 — polymorphic references are trigger-validated, not FK-constrained).

### Phase Status

- [x] Phase Complete

---

## Phase 18 — Delete Management

### Goal

Safely delete items.

### Tasks

- [x] Add reusable delete confirmation (`ItemDetailPage.tsx` reuses Phase 17's `ConfirmDialog`, gated behind `user` same as the existing Edit link)
- [x] Explain related images/relationships affected by deletion (`detail.deleteConfirmBody` interpolates live gallery image count and relationship count into the confirmation text)
- [x] Delete item and associated data safely (`deleteApi.ts` `deleteItem()`: removes Storage objects, then `item_images`, `item_relationships` (both parent- and child-side), and `item_tags` rows, then the item row itself — `game_genres` needs no explicit handling, it's a real FK with `on delete cascade`, unlike the polymorphic tables)
- [x] Update dashboard counts, listing caches, and activity after mutation — no client-side cache exists anywhere in the app (every listing/dashboard hook fetches fresh on mount), so navigating to the type listing after delete already reflects the change; nothing extra needed
- [x] Provide success/error feedback and sensible redirect (`useDeleteItem.ts` surfaces a `deleteError` inline banner on failure; on success `ItemDetailPage` navigates to `/${ITEM_TYPE_ROUTES[itemType]}` with `{ deletedTitle }` router state, and `ItemListingPage` renders a dismissible success banner from that state, then clears it via a `replace` navigation so refresh/back doesn't re-show it)

### Testing & Verification

- [x] Cancel leaves data unchanged — verified live by the owner: Cancel closes the dialog with no mutation, item/images/relationships unchanged after refresh
- [x] Confirm removes only the intended record and dependent resources — verified live by the owner: delete redirects with success banner, item and its images/relationships/Storage objects are gone, unrelated items untouched; permission check (no Delete/Edit for signed-out visitors) also confirmed

### Definition of Done

- [x] Delete is safe, responsive, and permission-protected

### Out of Scope

Traded/Sold workflow and bulk actions.

### Phase Status

- [x] Phase Complete

---

## Phase 19 — Duplicate Detection & Unsaved Changes Guard

### Goal

Prevent accidental duplicate records and loss of form edits.

### Tasks

- [x] Define type-aware duplicate matching rules — deliberately title-only, not type-aware: normalized (trimmed, case-insensitive) exact title match within the same item type (`duplicateApi.ts` `findLikelyDuplicates`, using `ilike` with no wildcards). Confirmed with the owner during planning as the simplest rule that still catches the common "already own this" case, over a stricter per-type secondary-key rule (platform/publisher/manufacturer)
- [x] Check likely duplicates during Add flow without blocking legitimate variants — `AddItemPage.tsx` `CreateItemForm.handleSubmit` calls `findLikelyDuplicates` after validation passes and before saving; a failed duplicate check never blocks the save (soft warning only), and Edit flow doesn't run this check at all
- [x] Show duplicate comparison with `View Existing`, `Add Anyway`, and `Update Existing` (`DuplicateWarningDialog.tsx`: per-match `View Existing`/`Update Existing` navigate to the existing item's detail/edit route — both abandon the new unsaved form, there's no field-merge logic — plus one dialog-level `Add Anyway` that proceeds with the original save)
- [x] Add dirty-form detection (`ItemForm.tsx` computes `isDirty` via `JSON.stringify` comparison of current vs. initial form state and related-item ids; shared by both Add and Edit since both render `ItemForm`)
- [x] Guard internal navigation, browser back, refresh, and modal close — implemented as a lightweight hand-rolled guard (`useUnsavedChangesGuard.ts`), not React Router's `useBlocker`, since the app uses declarative `<BrowserRouter>` and `useBlocker` requires a data router (`createBrowserRouter`); migrating was scoped out during planning. Covers: same-origin `<a>` clicks anywhere in the app (Sidebar, BottomTabBar, Cancel button) via a capture-phase click interceptor, and refresh/tab-close/external nav via `beforeunload`. Does **not** cover the physical browser Back/Forward buttons, or other components' programmatic `navigate()` calls (e.g. selecting a Global Search result) — both accepted as documented limitations of this approach, confirmed with the owner during planning. "Modal close" doesn't apply: Add/Edit are full-page routes, not a JS modal (Phase 16 decision)
- [x] Show `Keep Editing` and `Discard Changes` choices (`ItemForm.tsx` renders the existing `ConfirmDialog` wired to the guard's `confirmDiscard`/`cancelDiscard`)

### UI / UX

- [x] Desktop/Tablet use accessible dialogs (both new dialogs reuse the existing Radix-Dialog-based `ConfirmDialog`/`Dialog` primitives already used for image/item delete)
- [x] Mobile uses an appropriate modal or bottom sheet — reuses the same centered `Dialog` primitive as Phase 17/18's confirm dialogs rather than a distinct bottom sheet, consistent with how those already behave on mobile
- [x] Warning text identifies what will happen without being alarmist (`form.unsavedChangesBody`, `duplicates.dialogBody` — plain statements of consequence, no scare language)

### Testing & Verification

- [x] Exact and fuzzy duplicates are handled according to documented rules — verified live by the owner: the rule is exact-title-only (no fuzzy matching in scope), duplicate dialog appears for an exact-title resubmit
- [x] Saved/untouched forms do not trigger the guard — verified live by the owner: untouched forms navigate away with no prompt
- [x] Discard and continue paths work across navigation methods — verified live by the owner: Cancel and internal link navigation prompt correctly; browser refresh/tab-close shows the native leave-site prompt

### Definition of Done

- [x] CRUD protects against common duplicate and unsaved-work mistakes

### Phase Status

- [x] Phase Complete

---

## Phase 20 — Completeness Calculation

### Goal

Calculate and display collection completeness consistently.

### Tasks

- [ ] Define required/optional completeness fields per item type
- [ ] Implement shared deterministic calculation
- [ ] Recalculate after item, relationship, or image changes
- [ ] Display percentage/progress on detail and relevant summary surfaces
- [ ] Document how missing fields affect the result

### Testing & Verification

- [ ] Unit test empty, partial, and complete examples for all item types
- [ ] UI updates immediately after relevant edits

### Definition of Done

- [ ] Completeness is deterministic, tested, and clearly represented

### Phase Status

- [ ] Phase Complete

---

## Phase 21 — RAWG/IGDB Autofill for Games

### Goal

Speed up Game entry with optional external metadata while keeping the owner in control.

### Tasks

- [ ] Select provider and document API/licensing constraints
- [ ] Proxy secrets through a secure server-side function
- [ ] Search external games from Add/Edit flow
- [ ] Preview and selectively apply title, description, dates, developer, publisher, genres, and artwork
- [ ] Never overwrite user-entered values without confirmation
- [ ] Handle provider rate limits, missing data, and outages

### Testing & Verification

- [ ] Autofill success, partial data, cancellation, and failure paths work
- [ ] API credentials are absent from client bundle

### Definition of Done

- [ ] Owner can optionally import game metadata safely and review it before saving

### Phase Status

- [ ] Phase Complete

---

## Phase 22 — Empty, Loading, Error & No Results States

### Goal

Make every screen understandable and recoverable when content or network state is imperfect.

### Tasks

- [ ] Create shared skeleton components for dashboard, cards, rows, details, galleries, stats, and forms
- [ ] Design first-collection and empty-category states
- [ ] Design empty Recently Added state
- [ ] Design search no-results and filtered-zero-results states
- [ ] Add broken-image fallback
- [ ] Add API, save, upload, auth-expired, and offline errors with retry/recovery actions
- [ ] Prevent layout shift where practical

### UI / UX

- [ ] Every state has Desktop, Tablet, and Mobile behavior
- [ ] Empty states guide the owner to Add Item but do not expose CRUD to public users
- [ ] Error messages are specific and actionable

### Testing & Verification

- [ ] Simulate slow, empty, failed, offline, and unauthorized scenarios
- [ ] Verify retry and recovery actions

### Definition of Done

- [ ] No major route depends on a happy-path-only UI

### Phase Status

- [ ] Phase Complete

---

## Phase 23 — Deployment & Production Verification

### Goal

Deploy a secure, stable MVP and verify production behavior.

### Tasks

- [ ] Configure Vercel production environment variables
- [ ] Apply reviewed migrations and Storage policies to production Supabase
- [ ] Configure SPA routing, headers, and canonical metadata
- [ ] Add error monitoring or documented production diagnostics
- [ ] Verify public access and owner authentication
- [ ] Run production smoke test across all primary routes

### Testing & Verification

- [ ] Build, lint, typecheck, and automated tests pass
- [ ] Desktop, Tablet, and Mobile production checks pass
- [ ] Public cannot write via UI or direct API calls
- [ ] CRUD, search, filters, images, and relationships work in production

### Definition of Done

- [ ] MVP is deployed and verified end to end
- [ ] Mark `MVP Complete` in the progress section

### Phase Status

- [ ] Phase Complete

---

**POST-MVP ENHANCEMENTS**

---

## Phase 24 — Statistics & Collection Insights

### Goal

Turn collection data into useful, readable insights.

### Tasks

- [ ] Build statistics route and query layer
- [ ] Show total items
- [ ] Show breakdowns by type, platform, genre, and condition
- [ ] Show additions over time
- [ ] Show completeness distribution

### UI / UX

- [ ] Desktop uses a balanced metric/chart layout
- [ ] Tablet reflows charts and cards without horizontal overflow
- [ ] Mobile prioritizes key metrics and uses scrollable/stacked insights
- [ ] Charts have textual equivalents and accessible labels

### Definition of Done

- [ ] Statistics are accurate, responsive, and useful without duplicating the dashboard

### Phase Status

- [ ] Phase Complete

---

## Phase 25 — Settings & Preferences

### Goal

Centralize display and collection preferences.

### Tasks

- [ ] Build Settings route
- [ ] Add default Grid/List view and sort order
- [ ] Add preferred platforms and theme preference
- [ ] Add language-ready structure if localization is planned
- [ ] Add image-loading preference
- [ ] Persist public-safe preferences locally and account-specific preferences remotely if justified

### Testing & Verification

- [ ] Preferences apply consistently after refresh and sign-in
- [ ] Invalid or outdated stored values fall back safely

### Definition of Done

- [ ] Supported preferences are centralized, persistent, and reflected throughout the UI

### Phase Status

- [ ] Phase Complete

---

## Phase 26 — Profile & Collection Overview

### Goal

Complete the Profile destination already represented in mobile navigation.

### Tasks

- [ ] Build profile/collection overview route
- [ ] Show avatar, collection name, collection-since date, and high-level stats
- [ ] Link to Recently Added, Statistics, and Settings
- [ ] Distinguish public collection overview from owner-only account actions
- [ ] Add logout action for authenticated owner

### UI / UX

- [ ] Desktop integrates naturally with the application shell
- [ ] Tablet uses compact overview cards
- [ ] Mobile provides a complete destination for the Profile tab

### Definition of Done

- [ ] Profile has a clear purpose and works for both public and owner contexts

### Phase Status

- [ ] Phase Complete

---

## Phase 27 — Responsive Refinement Pass

### Goal

Perform a deliberate three-device review of every implemented screen and state.

### Tasks

- [ ] Create route/state/device verification matrix
- [ ] Review Dashboard, All Items, six type pages, platforms, Recently Added, Search, Filters, Details, relationships, Gallery, CRUD, Stats, Settings, and Profile
- [ ] Review Grid/List, empty/loading/error/no-results, duplicate warning, and unsaved changes
- [ ] Fix overflow, density, tap targets, sticky controls, safe areas, and virtual-keyboard issues
- [ ] Confirm no feature depends exclusively on hover

### Testing & Verification

- [ ] Desktop: 1440px and representative wider/narrower widths
- [ ] Tablet: 768px–1024px in portrait and landscape where relevant
- [ ] Mobile: 320px–430px including safe-area behavior
- [ ] Long titles, large font scaling, missing images, and dense metadata remain usable

### Definition of Done

- [ ] Every route and important state has verified device-appropriate behavior

### Phase Status

- [ ] Phase Complete

---

## Phase 28 — Accessibility Pass

### Goal

Meet practical WCAG 2.2 AA expectations across the application.

### Tasks

- [ ] Verify semantic landmarks, headings, labels, and field descriptions
- [ ] Verify keyboard order, visible focus, skip navigation, dialogs, menus, and sheets
- [ ] Verify screen-reader names and live feedback for async actions
- [ ] Verify contrast in dark/light themes and all status badges
- [ ] Verify reduced-motion behavior and zoom/text scaling
- [ ] Add accessible alternatives for charts and image controls

### Testing & Verification

- [ ] Automated accessibility scan on representative routes
- [ ] Manual keyboard-only pass
- [ ] Manual screen-reader smoke test

### Definition of Done

- [ ] No critical accessibility issue remains in primary flows

### Phase Status

- [ ] Phase Complete

---

## Phase 29 — Performance Pass

### Goal

Keep the collection fast as its item and image counts grow.

### Tasks

- [ ] Measure production Core Web Vitals and route performance
- [ ] Lazy-load routes, media viewer, charts, and admin-only code
- [ ] Optimize image sizing, formats, loading priority, and caching
- [ ] Review query payloads, indexes, pagination, and cache invalidation
- [ ] Virtualize only lists proven to need it
- [ ] Remove unnecessary renders and duplicate requests

### Testing & Verification

- [ ] Test with a realistically large generated dataset
- [ ] Verify slow-network and mid-range mobile performance
- [ ] Document performance budget and results

### Definition of Done

- [ ] Primary browse/search/detail flows remain responsive at expected collection scale

### Phase Status

- [ ] Phase Complete

---

## Phase 30 — Testing Hardening

### Goal

Protect the complete product with a maintainable automated test suite.

### Tasks

- [ ] Unit test normalization, filters, search helpers, duplicate rules, and completeness
- [ ] Component test cards/rows, filter controls, forms, dialogs, viewer, and state components
- [ ] Integration test Supabase query/mutation hooks and authorization behavior
- [ ] E2E test public browse/search/filter/detail flows
- [ ] E2E test owner login and create/edit/delete/image/status flows
- [ ] E2E test duplicate warning and unsaved changes guard
- [ ] Add stable fixtures and deterministic test data
- [ ] Run critical tests in CI

### Testing & Verification

- [ ] Test matrix covers Desktop, Tablet, and Mobile viewports
- [ ] No flaky critical-path tests
- [ ] CI blocks merge on build, lint, typecheck, and critical test failures

### Definition of Done

- [ ] Core collection and CRUD workflows are protected by reliable automated tests

### Phase Status

- [ ] Phase Complete

---

## Explicitly Excluded

The following functionality is intentionally not planned unless the product direction changes:

- Traded / Sold standalone screen or workflow
- Wishlist / ownership-status tracking
- Pricing and value tracking
- Bulk selection and bulk actions
- Import / Export collection

## Optional / Future Ideas (not scheduled)

Promote an item below to a numbered phase only after explicit approval:

- [ ] Sharing a public item or filtered collection link
- [ ] Barcode scanning
- [ ] Cloud backup beyond the primary database
- [ ] Localization beyond language-ready architecture
- [ ] PWA/offline browsing

## Final Completion Checklist

- [ ] All MVP phases complete
- [ ] All Post-MVP phases selected for the release complete
- [ ] Every user-facing screen verified on Desktop, Tablet, and Mobile
- [ ] Public read and owner-only write security verified
- [ ] Production backup/recovery procedure documented
- [ ] README updated with setup, migrations, seed, environment, testing, and deployment instructions
