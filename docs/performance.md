# Performance (ROADMAP Phase 39)

How fast the public pages load, the budget they're held to, and how to measure again.

## How it's measured

```bash
npm run build && npm run preview                  # serves dist/ on :4173 (another terminal)
npm run perf:vitals                               # 5 pages × mobile + desktop, 5 runs each (medians)
npm run perf:vitals -- --runs 1 --profile mobile --route /games --waterfall   # request timeline
npm run perf:vitals -- --with-images              # after Phase 34 only — see "Images" below
```

`scripts/perf/vitals.mjs` (copied from the diecast app) drives the local Edge/Chrome headless over
the DevTools protocol, no dependencies. Every run is a cold, signed-out first visit against the
live Supabase project. **mobile** ≈ Lighthouse's mobile preset (412×823 at 1.75×, 4× CPU
slowdown, Slow 4G: 150 ms RTT, 1.6 Mbps); **desktop**: 1350×940, no CPU slowdown, 40 ms /
10 Mbps. Throttling is applied by DevTools, so the numbers compare run to run on one machine,
not with PageSpeed Insights. Expect ±150–200 ms between runs from the network to Supabase.
Raw results: `backups/perf/{before,after,final}.{txt,json}` (git-ignored).

Pages: `/` (dashboard), `/games` (a listing), `/games/04a0…` ("Alan Wake", a detail page with
5 photos), `/items?q=creed` (title search — what both search entry points query), `/statistics`.

### Images

**Storage images are blocked by default.** Until the Phase 34 WebP flip the photos are the 1–7 MB
originals, and 50 cold runs would download hundreds of MB of the org's shared 5 GB/month. So
these numbers cover the app shell, data and layout; the hero and favicons (static files on
Vercel) are included, collection photos are not. The detail page's LCP is a placeholder until
then. After Phase 34, re-run with `--with-images` (≈ 1 MB per listing load) and fill in the
pending rows.

## Budget

| Metric (lab) | Budget | Now | |
| --- | --- | --- | --- |
| LCP, mobile — dashboard, listing, statistics | < 2.5 s | 2.35 / 2.36 / 1.87 s | ✅ |
| LCP, mobile — search | < 2.5 s | 2.77 s | ❌ gap 1 |
| LCP, mobile — detail page | < 2.5 s | pending Phase 34 (photo is the LCP) | ⏳ |
| LCP, desktop — every page | < 1.0 s | 0.32–0.80 s | ✅ |
| CLS | < 0.1 | ≤ 0.084 (dashboard, desktop) | ✅ |
| TBT (INP proxy), mobile | < 200 ms | ≤ 71 ms | ✅ |
| Initial JS (scripts in `index.html`, gzip) | ≤ 170 kB | ≈ 201 kB | ❌ gap 2 |
| JS per page, transferred | — | 207–220 kB | |
| Listing images | ≤ 1 MB | pending Phase 34 | ⏳ |
| `all_items` listing response (20 rows) | — | 2.2 kB transferred | |

## Before / after (2026-10-09, medians of 5)

Mobile (Slow 4G, 4× CPU):

| Page | LCP before → after | Requests | JS kB | Largest `all_items` response |
| --- | --- | --- | --- | --- |
| `/` | **3,512 → 2,348 ms** | 80 → 64 | 253.5 → 219.8 | 10.9 kB (same) |
| `/games` | 2,660 → 2,356 ms | 89 → 75 | 253.6 → 220.0 | 15.7 → 2.2 kB |
| `/games/04a0…` | 1,696 → 1,596 ms | 61 → 51 | 226.6 → 218.5 | — |
| `/items?q=creed` | 3,340 → 2,772 ms | 69 → 55 | 253.6 → 220.0 | 9.7 → 2.2 kB |
| `/statistics` | 1,956 → 1,868 ms | 38 → 28 | 215.2 → 207.4 | **204.5 → 33.6 kB** (488 → 155 kB raw; 1.7 → 0.8 s) |

Desktop: LCP was already 0.35–0.78 s and stays there (0.32–0.80 s), with the same request and
byte savings.

## What changed

1. **The filter sheet loads on first use.** It statically imported react-day-picker (≈ 24 kB
   gzip), and a lazy route chunk can't run until all its imports arrive, so every listing and the
   dashboard waited for a date picker in a closed sheet (it finished at 2.44 s on mobile). Now
   `React.lazy`, mounted on first open, prefetched on hover/focus. `lib/dialogFocus` is imported
   in `main.tsx` so focus return keeps working (an E2E test caught that regression).
2. **The dashboard hero is preloaded on `/`** (inline script in `index.html`, same
   srcset/sizes as the `<img>`) and has an 800 px variant for phones (27 kB). It was the mobile
   LCP and was only discovered after the JS and the page chunk; now it downloads alongside the JS.
3. **`has_description`** (migration `20261011120000_…`): cards and statistics only need to know
   *whether* there's a description; the text was 58 % of every `all_items` row.
4. **`format_slug`** (migration `20261011130000_…`): the Digital/Physical badge came from a second,
   serial `item_tags` request after every listing query (≈ 200–300 ms on mobile); it's now in the
   same response. Both are PostgREST computed fields, selected through `ALL_ITEM_COLUMNS`.
5. **`preconnect`** to the Supabase origin in `index.html`.

Tried and reverted: lazy-loading the top bar's search dialog and menu sheet. It took ≈ 6 kB out
of the startup bundle, but total JS per page didn't change (the shared Radix code just moved),
so it wasn't worth the code.

## Not changed, on purpose

- **Duplicate requests:** none. The dashboard's "10 `all_items` requests" are 5 GETs plus 5 CORS
  preflights (supabase-js sends custom headers; each distinct URL is preflighted once). Every
  screen fetches each thing once. **No TanStack Query**: nothing measured shows refetch churn, so
  the dependency isn't justified.
- **Indexes:** none added. Measured from the client, every query costs 74–126 ms against a 76 ms
  bare round trip, so the server work is a few ms; `all_items` is a UNION ALL over seven small
  tables. The base tables already index platform, release date, created date and a title trigram.
  `supabase/checks/performance.sql` has the `EXPLAIN (ANALYZE)` statements to re-check when the
  collection passes ~5,000 items.
- **Edit-only chunks:** `useSaveItem` (≈ 39 kB gzip) loads only on the add/edit routes, and
  `DatePickerField` now only there and in the filter sheet. Nothing to do.

## Gaps

1. **Search LCP 2.77 s on mobile.** The chain is JS (≈ 1.4 s on Slow 4G) → the lazy listing chunk
   and its imports (≈ 0.4 s) → the queries (≈ 0.3 s) → render. The remaining lever is starting the
   listing query before the page chunk has loaded (route-level data loading). That needs a data
   router, which the app doesn't use (`useUnsavedChangesGuard` notes the same limit), so it's left
   for a later decision.
2. **Initial JS ≈ 201 kB gzip, over the 170 kB budget.** It's almost all framework: react-dom
   (≈ 60 kB gzip), supabase-js (≈ 59 kB, of which ≈ 15 kB is the realtime client this app never
   uses but `createClient` always bundles), react-router (≈ 13 kB), Radix menus/floating-ui for the
   eagerly rendered top-bar dropdowns, and both locales' strings (≈ 8 kB). The only big cut would
   be replacing `createClient` with the separate `postgrest-js` / `auth-js` / `storage-js`
   clients, a rewrite of every query module for ≈ 15 kB. Not worth it now; the budget should
   probably become ≤ 205 kB unless that's done.

## Scale

At 433 items, and checked for ~1,500 and 15,000:

- Listings, search, duplicates and related items are **paged or capped on the server** (20 per
  page, 30 results, 10 duplicates), so their cost doesn't grow with the collection.
- The **statistics page** is the one place that processes every row in the browser (plus the
  dashboard's per-type counts, which only fetch `id, item_type`). `computeStatistics` handles
  1,500 generated items in a few ms and 15,000 well under the test's limit
  (`statistics.scale.test.ts`; generated rows only, never written anywhere). Its charts render
  aggregates, so render cost doesn't grow either. Payload: ≈ 78 bytes per item gzip-transferred
  (33.6 kB for 433), so 1,500 items ≈ 115 kB, paged in 1,000s by `fetchAllRows`.
