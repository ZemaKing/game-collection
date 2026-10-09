-- Phase 39 — query plans for the app's common reads (read-only; run in the SQL editor).
--
-- Decision 2026-10-09: NO new indexes. At 433 items every query below is served in a few ms on
-- the server (measured from the client: 74–126 ms per request against a 76 ms bare round trip),
-- and all_items is a UNION ALL over seven small tables, where a sequential scan beats an index.
-- The base tables already index platform_id, release_date, created_at and a trigram on title
-- (baseline migration). Re-run this file when the collection passes ~5,000 items, or if a
-- listing feels slow: look for a Seq Scan whose "actual time" dominates the plan.
--
-- Run each statement on its own; `explain (analyze, buffers)` executes the query but returns
-- only the plan. Nothing here writes.

-- 1. A listing page: first 20 by title (every type page and /items).
explain (analyze, buffers)
select id, item_type, title, subtitle, platform_id, release_date, collection_date, condition,
       cover_image_path, cover_thumb_path, genre_slug, genre_name, edition_name, completed,
       parent_game_id, created_at, updated_at, public.has_description(all_items)
from public.all_items
order by title asc nulls last
limit 20;

-- 2. The same with the total PostgREST asks for (count=exact).
explain (analyze, buffers)
select count(*) from public.all_items;

-- 3. One type, newest first (Recently Added, "recently added" sort on a type page).
explain (analyze, buffers)
select id, title, created_at
from public.all_items
where item_type = 'game'
order by created_at desc nulls last
limit 20;

-- 4. Platform filter (platform pages).
explain (analyze, buffers)
select id, title
from public.all_items
where platform_id = (select id from public.platforms order by name limit 1)
order by title
limit 20;

-- 5. Title search: one ilike per token on the computed title_search field.
explain (analyze, buffers)
select id, title
from public.all_items
where public.title_search(all_items) ilike '%assassin%'
  and public.title_search(all_items) ilike '%creed%'
limit 30;

-- 6. The statistics page's full pass (every row, light columns).
explain (analyze, buffers)
select id, item_type, subtitle, platform_id, release_date, collection_date, condition,
       public.has_description(all_items), cover_image_path, created_at
from public.all_items
order by id;
