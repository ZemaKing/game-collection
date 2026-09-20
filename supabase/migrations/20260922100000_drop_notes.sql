-- Notes are no longer tracked on any item. Rebuild `all_items` without its
-- `notes` column, then drop `notes` from every item table.
--
-- WARNING: this permanently deletes every stored note.
--
-- The view is rebuilt from the latest definition (20260921100100).

drop view public.all_items;

create view public.all_items
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
  g.updated_at
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
  se.updated_at
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
  sb.updated_at
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
  ab.updated_at
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
  f.updated_at
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
  s.updated_at
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
  d.updated_at
from public.dlcs d
join public.games pg on pg.id = d.game_id;

grant select on public.all_items to anon, authenticated;

alter table public.games drop column notes;
alter table public.special_editions drop column notes;
alter table public.steelbooks drop column notes;
alter table public.artbooks drop column notes;
alter table public.figures drop column notes;
alter table public.stuff drop column notes;
alter table public.dlcs drop column notes;
