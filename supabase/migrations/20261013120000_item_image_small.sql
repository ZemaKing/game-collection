-- Phase 39 gap 3 — the `small` image variant: a 4:5 crop at 400×500 for
-- phone cards and small strips, offered next to the thumb through srcset
-- (src/features/items/imageSizes.ts).
--
-- 1. item_images gains small_path (null until the backfill job has made the
--    object: scripts/migrate-images, `npm run images:small`). New uploads write
--    it directly (src/features/items/imageApi.ts).
-- 2. all_items gains cover_small_path, appended as the LAST column (the same
--    reason as cover_thumb_path in 20261010120000: `create or replace view`
--    can only append, which keeps the view, its grants and the search
--    functions in place). The other columns are restated unchanged.
-- 3. set_item_image_small(): writes small_path for many rows in one
--    transaction (service role only), refusing rows whose storage_path changed
--    since the plan was made.
--
-- Apply BEFORE deploying the app code that selects small_path /
-- cover_small_path, or those queries fail. Re-runnable.

-- ---------------------------------------------------------------------
-- 1. item_images.small_path
-- ---------------------------------------------------------------------

alter table public.item_images
  add column if not exists small_path text;

alter table public.item_images drop constraint if exists item_images_small_path_not_blank;
alter table public.item_images add constraint item_images_small_path_not_blank
  check (small_path <> '');

-- ---------------------------------------------------------------------
-- 2. all_items: + cover_small_path (last column)
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
  ) as cover_thumb_path,
  (
    select ii.small_path from public.item_images ii
    where ii.item_type = 'game' and ii.item_id = g.id and ii.is_cover
    limit 1
  ) as cover_small_path
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
  ) as cover_thumb_path,
  (
    select ii.small_path from public.item_images ii
    where ii.item_type = 'special_edition' and ii.item_id = se.id and ii.is_cover
    limit 1
  ) as cover_small_path
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
  ) as cover_thumb_path,
  (
    select ii.small_path from public.item_images ii
    where ii.item_type = 'steelbook' and ii.item_id = sb.id and ii.is_cover
    limit 1
  ) as cover_small_path
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
  ) as cover_thumb_path,
  (
    select ii.small_path from public.item_images ii
    where ii.item_type = 'artbook' and ii.item_id = ab.id and ii.is_cover
    limit 1
  ) as cover_small_path
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
  ) as cover_thumb_path,
  (
    select ii.small_path from public.item_images ii
    where ii.item_type = 'figure' and ii.item_id = f.id and ii.is_cover
    limit 1
  ) as cover_small_path
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
  ) as cover_thumb_path,
  (
    select ii.small_path from public.item_images ii
    where ii.item_type = 'stuff' and ii.item_id = s.id and ii.is_cover
    limit 1
  ) as cover_small_path
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
  ) as cover_thumb_path,
  (
    select ii.small_path from public.item_images ii
    where ii.item_type = 'dlc' and ii.item_id = d.id and ii.is_cover
    limit 1
  ) as cover_small_path
from public.dlcs d
join public.games pg on pg.id = d.game_id;

-- ---------------------------------------------------------------------
-- 3. set_item_image_small(p_rows, p_dry_run)
-- ---------------------------------------------------------------------
-- p_rows: [{id, expected_storage_path, small_path}]. Every id must exist and
-- still have expected_storage_path, or nothing is changed. A dry run reports
-- the exact counts and rolls back.

create or replace function public.set_item_image_small(
  p_rows jsonb,
  p_dry_run boolean default true
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_result jsonb;
  v_updated integer;
  v_missing text[];
  v_stale text[];
begin
  begin -- inner block: a dry run raises at its end, which rolls back everything done inside it
    select coalesce(array_agg(x.id::text), '{}') into v_missing
    from jsonb_to_recordset(p_rows) as x(id uuid)
    where not exists (select 1 from public.item_images i where i.id = x.id);
    if cardinality(v_missing) > 0 then
      raise exception 'set_item_image_small: % unknown item_images id(s): %',
        cardinality(v_missing), array_to_string(v_missing[1:5], ', ');
    end if;

    select coalesce(array_agg(x.id::text), '{}') into v_stale
    from jsonb_to_recordset(p_rows) as x(id uuid, expected_storage_path text)
    join public.item_images i on i.id = x.id
    where i.storage_path is distinct from x.expected_storage_path;
    if cardinality(v_stale) > 0 then
      raise exception 'set_item_image_small: % row(s) changed since the plan (storage_path differs): %',
        cardinality(v_stale), array_to_string(v_stale[1:5], ', ');
    end if;

    with src as (
      select * from jsonb_to_recordset(p_rows) as x(id uuid, small_path text)
    ), upd as (
      update public.item_images i
      set small_path = s.small_path
      from src s
      where i.id = s.id and i.small_path is distinct from s.small_path
      returning i.id
    )
    select count(*) into v_updated from upd;

    v_result := jsonb_build_object(
      'rows', jsonb_array_length(p_rows),
      'updated', v_updated,
      'with_small', (select count(*) from public.item_images where small_path is not null),
      'total', (select count(*) from public.item_images));

    if p_dry_run then
      raise exception using errcode = 'ZZ001', message = 'set_item_image_small dry-run rollback';
    end if;
  exception
    when sqlstate 'ZZ001' then
      return v_result || jsonb_build_object('dry_run', true);
  end;

  return v_result || jsonb_build_object('dry_run', false);
end;
$$;

revoke all on function public.set_item_image_small(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.set_item_image_small(jsonb, boolean) to service_role;

-- Let PostgREST pick up the new columns without a restart.
notify pgrst, 'reload schema';
