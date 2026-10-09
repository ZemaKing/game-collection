-- Phase 33 — Image variants: room for WebP full + thumbnail per image.
--
-- No row changes here: every new column is null until the Phase 34 flip
-- (scripts/migrate-images, `set_item_image_variants`), and the app keeps
-- reading `storage_path` / `cover_image_path` exactly as before.
--
-- 1. item_images gains
--      thumb_path     the small WebP (fits 600×750) for cards, strips and lists
--      width, height  pixel size of the full image at storage_path
--      original_path  the pre-migration object, kept for rollback until the
--                     originals are retired (Phase 37)
-- 2. all_items gains cover_thumb_path (the cover's thumb_path), appended as
--    the LAST column. `create or replace view` can only append, and that keeps
--    the view (and its grants, and the title_search/subtitle_search functions
--    that depend on its row type) in place — no drop needed. The other
--    columns are restated unchanged from the baseline.
--
-- Re-runnable: `add column if not exists`, constraints dropped first,
-- `create or replace view`.

-- ---------------------------------------------------------------------
-- 1. item_images: variant columns
-- ---------------------------------------------------------------------

alter table public.item_images
  add column if not exists thumb_path text,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists original_path text;

alter table public.item_images drop constraint if exists item_images_size_positive;
alter table public.item_images add constraint item_images_size_positive
  check ((width is null and height is null) or (width > 0 and height > 0));

alter table public.item_images drop constraint if exists item_images_paths_not_blank;
alter table public.item_images add constraint item_images_paths_not_blank
  check (thumb_path <> '' and original_path <> '');

-- ---------------------------------------------------------------------
-- 2. all_items: + cover_thumb_path (last column)
-- ---------------------------------------------------------------------

create or replace view public.all_items
  with (security_invoker = true)
as
select
  g.id,
  'game'::public.item_type as item_type,
  g.title,
  g.developer as subtitle,
  g.platform_id,
  g.release_date,
  g.collection_date,
  g.condition,
  g.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'game' and ii.item_id = g.id and ii.is_cover
    limit 1
  ) as cover_image_path,
  (
    select gn.slug from public.game_genres gg
    join public.genres gn on gn.id = gg.genre_id
    where gg.game_id = g.id
    order by gg.position
    limit 1
  ) as genre_slug,
  (
    select gn.name from public.game_genres gg
    join public.genres gn on gn.id = gg.genre_id
    where gg.game_id = g.id
    order by gg.position
    limit 1
  ) as genre_name,
  g.edition_name as edition_name,
  g.completed as completed,
  null::uuid as parent_game_id,
  g.created_at,
  g.updated_at,
  (
    select ii.thumb_path from public.item_images ii
    where ii.item_type = 'game' and ii.item_id = g.id and ii.is_cover
    limit 1
  ) as cover_thumb_path
from public.games g

union all

select
  se.id,
  'special_edition'::public.item_type as item_type,
  se.title,
  se.edition_name as subtitle,
  se.platform_id,
  se.release_date,
  se.collection_date,
  se.condition,
  se.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'special_edition' and ii.item_id = se.id and ii.is_cover
    limit 1
  ) as cover_image_path,
  null::text as genre_slug,
  null::text as genre_name,
  se.edition_name as edition_name,
  false as completed,
  null::uuid as parent_game_id,
  se.created_at,
  se.updated_at,
  (
    select ii.thumb_path from public.item_images ii
    where ii.item_type = 'special_edition' and ii.item_id = se.id and ii.is_cover
    limit 1
  ) as cover_thumb_path
from public.special_editions se

union all

select
  sb.id,
  'steelbook'::public.item_type as item_type,
  sb.title,
  sb.edition_name as subtitle,
  sb.platform_id,
  sb.release_date,
  sb.collection_date,
  sb.condition,
  sb.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'steelbook' and ii.item_id = sb.id and ii.is_cover
    limit 1
  ) as cover_image_path,
  null::text as genre_slug,
  null::text as genre_name,
  sb.edition_name as edition_name,
  false as completed,
  null::uuid as parent_game_id,
  sb.created_at,
  sb.updated_at,
  (
    select ii.thumb_path from public.item_images ii
    where ii.item_type = 'steelbook' and ii.item_id = sb.id and ii.is_cover
    limit 1
  ) as cover_thumb_path
from public.steelbooks sb

union all

select
  ab.id,
  'artbook'::public.item_type as item_type,
  ab.title,
  ab.publisher as subtitle,
  null::uuid as platform_id,
  ab.release_date,
  ab.collection_date,
  ab.condition,
  ab.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'artbook' and ii.item_id = ab.id and ii.is_cover
    limit 1
  ) as cover_image_path,
  null::text as genre_slug,
  null::text as genre_name,
  null::text as edition_name,
  false as completed,
  null::uuid as parent_game_id,
  ab.created_at,
  ab.updated_at,
  (
    select ii.thumb_path from public.item_images ii
    where ii.item_type = 'artbook' and ii.item_id = ab.id and ii.is_cover
    limit 1
  ) as cover_thumb_path
from public.artbooks ab

union all

select
  f.id,
  'figure'::public.item_type as item_type,
  f.title,
  f.manufacturer as subtitle,
  null::uuid as platform_id,
  f.release_date,
  f.collection_date,
  f.condition,
  f.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'figure' and ii.item_id = f.id and ii.is_cover
    limit 1
  ) as cover_image_path,
  null::text as genre_slug,
  null::text as genre_name,
  null::text as edition_name,
  false as completed,
  null::uuid as parent_game_id,
  f.created_at,
  f.updated_at,
  (
    select ii.thumb_path from public.item_images ii
    where ii.item_type = 'figure' and ii.item_id = f.id and ii.is_cover
    limit 1
  ) as cover_thumb_path
from public.figures f

union all

select
  s.id,
  'stuff'::public.item_type as item_type,
  s.title,
  s.category as subtitle,
  null::uuid as platform_id,
  s.release_date,
  s.collection_date,
  s.condition,
  s.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'stuff' and ii.item_id = s.id and ii.is_cover
    limit 1
  ) as cover_image_path,
  null::text as genre_slug,
  null::text as genre_name,
  null::text as edition_name,
  false as completed,
  null::uuid as parent_game_id,
  s.created_at,
  s.updated_at,
  (
    select ii.thumb_path from public.item_images ii
    where ii.item_type = 'stuff' and ii.item_id = s.id and ii.is_cover
    limit 1
  ) as cover_thumb_path
from public.stuff s

union all

select
  d.id,
  'dlc'::public.item_type as item_type,
  d.title,
  pg.title as subtitle,
  pg.platform_id,
  d.release_date,
  d.collection_date,
  d.condition,
  d.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'dlc' and ii.item_id = d.id and ii.is_cover
    limit 1
  ) as cover_image_path,
  (
    select gn.slug from public.game_genres gg
    join public.genres gn on gn.id = gg.genre_id
    where gg.game_id = d.game_id
    order by gg.position
    limit 1
  ) as genre_slug,
  (
    select gn.name from public.game_genres gg
    join public.genres gn on gn.id = gg.genre_id
    where gg.game_id = d.game_id
    order by gg.position
    limit 1
  ) as genre_name,
  null::text as edition_name,
  d.completed as completed,
  d.game_id as parent_game_id,
  d.created_at,
  d.updated_at,
  (
    select ii.thumb_path from public.item_images ii
    where ii.item_type = 'dlc' and ii.item_id = d.id and ii.is_cover
    limit 1
  ) as cover_thumb_path
from public.dlcs d
join public.games pg on pg.id = d.game_id;

-- Let PostgREST pick up the new columns without a restart.
notify pgrst, 'reload schema';
