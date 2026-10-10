# Performance (ROADMAP Phase 39)

How fast the public pages load, the budget they're held to, and how to measure again.

## How it's measured

```bash
npm run build && npm run preview                  # serves dist/ on :4173 (another terminal)
npm run perf:vitals                               # 5 pages × mobile + desktop, 5 runs each (medians)
npm run perf:vitals -- --runs 1 --profile mobile --route /games --waterfall   # request timeline
npm run perf:vitals -- --with-images              # also load the photos (≈ 1 MB per listing load) — see "Images"
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

**Storage images are blocked by default**, so a routine run costs almost no egress: the numbers
then cover the app shell, data and layout (the hero and favicons, static files on Vercel, are
included). Before the Phase 34 WebP flip the photos were the 1–7 MB originals. Since the flip
(2026-10-10) `--with-images` costs ≈ 0.5–1.1 MB per page load, ≈ 40 MB for a full run. The
"With images" section below is that run.

## Budget

| Metric (lab) | Budget | Now | |
| --- | --- | --- | --- |
| LCP, mobile — dashboard, listing, statistics | < 2.5 s | 2.35 / 2.36 / 1.87 s | ✅ |
| LCP, mobile — search | < 2.5 s | 2.77 s | ❌ gap 1 |
| LCP, mobile — with photos (listing / search / detail) | < 2.5 s | 4.50 / 5.10 / 3.65 s | ❌ gap 3 |
| LCP, desktop — with photos | < 1.0 s | 0.70–1.51 s (listing 1.40, search 1.51, detail 1.02) | ❌ gap 3 |
| LCP, desktop — every page | < 1.0 s | 0.32–0.80 s | ✅ |
| CLS | < 0.1 | ≤ 0.084 (dashboard, desktop) | ✅ |
| TBT (INP proxy), mobile | < 200 ms | ≤ 71 ms | ✅ |
| Initial JS (scripts in `index.html`, gzip) | ≤ 170 kB | ≈ 201 kB | ❌ gap 2 |
| JS per page, transferred | — | 207–220 kB | |
| Listing images (20 cards, all thumbs loaded) | ≤ 1 MB | ≈ 1.07–1.12 MB (was ≈ 22 MB); mobile first load 434 kB | ≈ ✅ |
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

## With images (2026-10-10, after the Phase 34 flip, medians of 5)

`npm run perf:vitals -- --with-images`. The app-only numbers above didn't move (same JS, same
data; dashboard and statistics LCP are unchanged), but once photos load they become the LCP element
on the listing, search and detail pages:

| Page | Mobile LCP | Mobile images | Desktop LCP | Desktop images |
| --- | --- | --- | --- | --- |
| `/` | 2,336 ms (hero) | 364 kB × 10 | 700 ms | 612 kB × 14 |
| `/games` | 4,504 ms (first card thumb) | 434 kB × 11 | 1,404 ms | 1,117 kB × 21 |
| `/games/04a0…` | 3,652 ms (full WebP) | 124 kB × 7 | 1,016 ms | 124 kB × 7 |
| `/items?q=creed` | 5,096 ms (first card thumb) | 719 kB × 11 | 1,508 ms | 1,138 kB × 20 |
| `/statistics` | 1,864 ms | 10 kB × 1 | 348 ms | 10 kB × 1 |

CLS stays ≤ 0.084 and TBT ≤ 41 ms. For comparison, before the flip one listing load was ≈ 22 MB of
originals.

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

3. **Photo LCP on mobile (4.5 s listing, 5.1 s search, 3.65 s detail) and desktop (1.0–1.5 s).**
   The `/games` waterfall (mobile, `--waterfall`) shows two halves. (a) The images can't start
   before ≈ 2.75 s: JS done 1.43 s → route chunk 1.76 s → `all_items` 2.69 s, which is gap 1's
   chain. (b) Then 11 thumbs (≈ 30–85 kB each, 434 kB) download in parallel over 1.6 Mbps, so each
   takes ≈ 2 s and the LCP card lands at ≈ 4.6 s. Instant images would still leave ≈ 2.8 s. Options,
   for the owner to choose:
   - **A smaller phone variant**, e.g. ≈ 320×400 (a 2-column card is ≈ 180 CSS px × 1.75 DPR ≈ 315
     px), served through `srcset`/`sizes`. ≈ 12 kB each would cut (b) to ≈ 0.7 s. Costs a third
     variant: one more upload run of ≈ 1,400 objects (≈ 20 MB) and a schema/read-path change.
   - **Fewer images competing:** priority only for the first visible row (2 cards on phones)
     instead of 6. Chrome still loads the other lazy cards near the viewport, so the gain is small.
   - **Route-level data loading** (gap 1) to start the query, and so the images, ≈ 0.7 s earlier.
   - **Detail page:** the main image is the full WebP (≈ 1600 px) on phones too, where the 600×750
     thumb is close to enough (a ≈ 380 px frame × 1.75 ≈ 665 px). `srcset` with the thumb as the
     narrow candidate would roughly halve its bytes.

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
