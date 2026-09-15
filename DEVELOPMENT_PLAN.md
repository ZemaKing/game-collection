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

Current Phase: Phase 12 — Item Detail Pages  
MVP Status: In Progress

## MVP Progress

- [x] Phase 1 — Project Foundation
- [x] Phase 2 — Design System & Application Shell
- [x] Phase 3 — Supabase Project Setup
- [ ] Phase 4 — Core Database Schema & RLS
- [ ] Phase 5 — Seed / Sample Data
- [x] Phase 6 — Dashboard & Collection Summary
- [x] Phase 7 — All Items & Type Listing Pages
- [x] Phase 8 — Grid and List Views
- [ ] Phase 9 — Platform & Recently Added Views
- [x] Phase 10 — Global Search
- [x] Phase 11 — Advanced Filters & Sort
- [ ] Phase 12 — Item Detail Pages
- [ ] Phase 13 — Special Edition Details & Item Relationships
- [ ] Phase 14 — Storage, Galleries & Media Viewer
- [ ] Phase 15 — Authentication
- [ ] Phase 16 — Add/Edit Item CRUD
- [ ] Phase 17 — Image Management CRUD
- [ ] Phase 18 — Delete Management
- [ ] Phase 19 — Duplicate Detection & Unsaved Changes Guard
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
- [ ] Authenticated owner CRUD succeeds
- [ ] Relationship constraints prevent invalid or orphaned references

### Definition of Done

- [ ] Schema supports all planned collection, search, filtering, CRUD, gallery, and relationship flows

### Out of Scope

Auth user creation, UI, production data entry.

### Phase Status

- [ ] Phase Complete

---

## Phase 5 — Seed / Sample Data

### Goal

Realistic, reusable sample data across all item types and planned UI states.

### Tasks

- [x] Seed platforms, genres, tags, and conditions
- [x] Seed several rows for each of the six item types
- [x] Seed special-edition contents and cross-item relationships
- [x] Seed cover images and gallery images
- [x] Seed records that exercise search, filters, duplicate detection, completeness, and recent activity
- [x] Make `supabase/seed.sql` idempotent

### Testing & Verification

- [x] Verify table counts and normalized `all_items` output
- [ ] Verify every listing/detail/state mockup has representative data

### Definition of Done

- [ ] Dev data supports every MVP screen without hard-coded page content

### Phase Status

- [ ] Phase Complete

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

- [ ] Build typed item-detail route and data loader
- [ ] Build shared detail shell plus type-specific field sections
- [ ] Show dates, condition, identifiers, description, notes, tags, and metadata where applicable
- [ ] Add owner-only Edit/Delete controls
- [ ] Add gallery thumbnail strip
- [ ] Add missing-item and invalid-route behavior

### UI / UX

- [ ] Desktop uses cover, metadata, description, and collection-info panels
- [ ] Tablet reorganizes content without hiding primary data
- [ ] Mobile prioritizes cover, title, essential metadata, and expandable description

### Testing & Verification

- [ ] All six item types render their correct fields
- [ ] Public/owner permissions render correct actions
- [ ] Direct navigation and refresh work

### Definition of Done

- [ ] Every collection item has a complete responsive detail page

### Phase Status

- [ ] Phase Complete

---

## Phase 13 — Special Edition Details & Item Relationships

### Goal

Represent collector editions and related physical/digital items as connected collection objects.

### Tasks

- [ ] Build Special Edition detail composition
- [ ] Show base game and edition contents (steelbook, artbook, figure, soundtrack, DLC, box, or other items)
- [ ] Build reusable Related Items section
- [ ] Support relationships such as Game → Special Edition → Steelbook/Artbook/Figure
- [ ] Add owner-only link/unlink item controls
- [ ] Prevent circular, duplicate, and invalid relationships

### UI / UX

- [ ] Relationships are understandable as cards/list rather than a technical graph
- [ ] Desktop, Tablet, and Mobile layouts preserve hierarchy and tap targets

### Testing & Verification

- [ ] Linked items navigate correctly in both directions
- [ ] Deleted items cannot leave broken relationship UI

### Definition of Done

- [ ] Special editions clearly expose their contents and related collection objects

### Phase Status

- [ ] Phase Complete

---

## Phase 14 — Storage, Galleries & Media Viewer

### Goal

Deliver fast cover/gallery images and an immersive viewer.

### Tasks

- [ ] Create Supabase Storage bucket and policies
- [ ] Build image URL helpers and responsive image variants
- [ ] Load cover plus ordered gallery thumbnails
- [ ] Build full-screen Media Viewer with previous/next, thumbnails, zoom, and close
- [ ] Support keyboard navigation and swipe gestures
- [ ] Add image count, loading, error, and fallback states

### UI / UX

- [ ] Desktop viewer supports keyboard and large preview
- [ ] Tablet viewer supports touch and compact thumbnails
- [ ] Mobile viewer uses edge-to-edge media and gesture-safe controls

### Testing & Verification

- [ ] Public can view images but cannot modify Storage
- [ ] Viewer works with one image, many images, and failed images

### Definition of Done

- [ ] Item galleries and Media Viewer are complete across all devices

### Phase Status

- [ ] Phase Complete

---

## Phase 15 — Authentication

### Goal

Public browsing with secure owner-only administration.

### Tasks

- [ ] Configure Supabase Auth for a single owner/admin account
- [ ] Build login/logout flow and session restoration
- [ ] Protect Add/Edit/Delete routes and controls
- [ ] Keep all read-only routes public
- [ ] Handle expired sessions and unauthorized deep links

### Testing & Verification

- [ ] Anonymous visitor can browse but cannot write
- [ ] Owner can authenticate and access CRUD
- [ ] Client UI and RLS independently enforce permissions

### Definition of Done

- [ ] Authentication and authorization are secure and predictable

### Phase Status

- [ ] Phase Complete

---

## Phase 16 — Add/Edit Item CRUD

### Goal

Create and update all six item types with responsive, validated forms.

### Tasks

- [ ] Build type selector for Game, Special Edition, Steelbook, Artbook, Figure, and Stuff
- [ ] Build shared fields and per-type form schemas
- [ ] Implement create and edit mutations
- [ ] Validate required fields, dates, numeric values, and conditional fields
- [ ] Add tags, genres, platform, status, condition, and relationship inputs
- [ ] Preserve draft values when moving between steps
- [ ] Show clear saving, success, and failure feedback

### UI / UX

- [ ] Desktop uses modal or wide panel consistent with mockups
- [ ] Tablet uses compact step/panel layout
- [ ] Mobile uses full-screen multi-step flow with sticky actions
- [ ] Forms remain usable with the virtual keyboard open

### Testing & Verification

- [ ] Create and edit each item type
- [ ] Validation blocks invalid submission and focuses the first error
- [ ] Public visitor cannot access form routes or mutations

### Definition of Done

- [ ] Owner can reliably create and edit every item type on every device

### Phase Status

- [ ] Phase Complete

---

## Phase 17 — Image Management CRUD

### Goal

Add owner-only upload, reorder, cover selection, replacement, and deletion.

### Tasks

- [ ] Upload one or multiple images with progress
- [ ] Validate file type, file size, and image count
- [ ] Reorder gallery images
- [ ] Set any image as cover
- [ ] Replace an existing image
- [ ] Delete an image with confirmation
- [ ] Add/edit alt text
- [ ] Roll back database/storage changes on partial failure

### UI / UX

- [ ] Desktop supports drag-and-drop plus file picker
- [ ] Tablet/mobile support picker, camera/gallery source where available, and touch reordering
- [ ] Destructive actions require explicit confirmation

### Testing & Verification

- [ ] Storage and database remain synchronized
- [ ] Unauthorized uploads and deletes fail
- [ ] Cover fallback remains valid after deletion

### Definition of Done

- [ ] Owner can fully manage item images without orphaned files or rows

### Phase Status

- [ ] Phase Complete

---

## Phase 18 — Delete Management

### Goal

Safely delete items.

### Tasks

- [ ] Add reusable delete confirmation
- [ ] Explain related images/relationships affected by deletion
- [ ] Delete item and associated data safely
- [ ] Update dashboard counts, listing caches, and activity after mutation
- [ ] Provide success/error feedback and sensible redirect

### Testing & Verification

- [ ] Cancel leaves data unchanged
- [ ] Confirm removes only the intended record and dependent resources

### Definition of Done

- [ ] Delete is safe, responsive, and permission-protected

### Out of Scope

Traded/Sold workflow and bulk actions.

### Phase Status

- [ ] Phase Complete

---

## Phase 19 — Duplicate Detection & Unsaved Changes Guard

### Goal

Prevent accidental duplicate records and loss of form edits.

### Tasks

- [ ] Define type-aware duplicate matching rules
- [ ] Check likely duplicates during Add flow without blocking legitimate variants
- [ ] Show duplicate comparison with `View Existing`, `Add Anyway`, and `Update Existing`
- [ ] Add dirty-form detection
- [ ] Guard internal navigation, browser back, refresh, and modal close
- [ ] Show `Keep Editing` and `Discard Changes` choices

### UI / UX

- [ ] Desktop/Tablet use accessible dialogs
- [ ] Mobile uses an appropriate modal or bottom sheet
- [ ] Warning text identifies what will happen without being alarmist

### Testing & Verification

- [ ] Exact and fuzzy duplicates are handled according to documented rules
- [ ] Saved/untouched forms do not trigger the guard
- [ ] Discard and continue paths work across navigation methods

### Definition of Done

- [ ] CRUD protects against common duplicate and unsaved-work mistakes

### Phase Status

- [ ] Phase Complete

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
