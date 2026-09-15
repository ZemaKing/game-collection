-- Normalized, unified view over every item type for the All Items page,
-- dashboard summaries, global search, and cross-type filtering.
--
-- security_invoker means the view is evaluated with the querying role's own
-- permissions, so RLS on the underlying tables (not the view owner's
-- permissions) determines what each caller can see.
create view public.all_items
  with (security_invoker = true)
as
select
  g.id,
  'game'::public.item_type as item_type,
  g.title,
  g.developer as subtitle,
  g.platform_id,
  g.region,
  g.release_date,
  g.status,
  g.collection_date,
  g.value,
  g.currency,
  g.condition,
  g.notes,
  g.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'game' and ii.item_id = g.id and ii.is_cover
    limit 1
  ) as cover_image_path,
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
  se.region,
  se.release_date,
  se.status,
  se.collection_date,
  se.value,
  se.currency,
  se.condition,
  se.notes,
  se.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'special_edition' and ii.item_id = se.id and ii.is_cover
    limit 1
  ) as cover_image_path,
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
  sb.region,
  sb.release_date,
  sb.status,
  sb.collection_date,
  sb.value,
  sb.currency,
  sb.condition,
  sb.notes,
  sb.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'steelbook' and ii.item_id = sb.id and ii.is_cover
    limit 1
  ) as cover_image_path,
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
  null::text as region,
  ab.release_date,
  ab.status,
  ab.collection_date,
  ab.value,
  ab.currency,
  ab.condition,
  ab.notes,
  ab.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'artbook' and ii.item_id = ab.id and ii.is_cover
    limit 1
  ) as cover_image_path,
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
  null::text as region,
  f.release_date,
  f.status,
  f.collection_date,
  f.value,
  f.currency,
  f.condition,
  f.notes,
  f.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'figure' and ii.item_id = f.id and ii.is_cover
    limit 1
  ) as cover_image_path,
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
  null::text as region,
  s.release_date,
  s.status,
  s.collection_date,
  s.value,
  s.currency,
  s.condition,
  s.notes,
  s.description,
  (
    select ii.storage_path from public.item_images ii
    where ii.item_type = 'stuff' and ii.item_id = s.id and ii.is_cover
    limit 1
  ) as cover_image_path,
  s.created_at,
  s.updated_at
from public.stuff s;

grant select on public.all_items to anon, authenticated;
