-- DLCs / expansions: a seventh item type that cannot exist without a base game.
--
-- Run AFTER 20260921100000_add_dlc_item_type.sql has been applied (the enum
-- value it adds must be committed before it can be used here).
--
-- * `dlcs.game_id` is NOT NULL with ON DELETE CASCADE, so a DLC can never
--   outlive its game; deleting a game removes its DLC rows.
-- * A DLC has no platform or genre of its own: `all_items` takes both from the
--   base game, and exposes the game's title as `subtitle` and the game's id as
--   the new `parent_game_id` column (null for every other type).
-- * `item_reference_exists` and the cleanup trigger learn about 'dlc' so
--   item_images / item_tags / item_relationships work for it like any type.
-- * The view is rebuilt from the latest definition (20260920100000).

create table public.dlcs (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  title text not null,
  dlc_type text not null default 'dlc' check (dlc_type in ('dlc', 'expansion')),
  release_date date,
  description text,
  collection_date date,
  condition public.item_condition,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger dlcs_set_updated_at before update on public.dlcs
  for each row execute function public.set_updated_at();

create index dlcs_game_idx on public.dlcs(game_id);
create index dlcs_release_date_idx on public.dlcs(release_date);
create index dlcs_created_at_idx on public.dlcs(created_at);
create index dlcs_title_trgm_idx on public.dlcs using gin (title gin_trgm_ops);

alter table public.dlcs enable row level security;

create policy "dlcs_public_select" on public.dlcs for select to anon, authenticated using (true);
create policy "dlcs_owner_write" on public.dlcs for all to authenticated using (true) with check (true);

create or replace function public.item_reference_exists(p_item_type public.item_type, p_item_id uuid)
returns boolean
language plpgsql
stable
as $$
begin
  return case p_item_type
    when 'game' then exists(select 1 from public.games where id = p_item_id)
    when 'special_edition' then exists(select 1 from public.special_editions where id = p_item_id)
    when 'steelbook' then exists(select 1 from public.steelbooks where id = p_item_id)
    when 'artbook' then exists(select 1 from public.artbooks where id = p_item_id)
    when 'figure' then exists(select 1 from public.figures where id = p_item_id)
    when 'stuff' then exists(select 1 from public.stuff where id = p_item_id)
    when 'dlc' then exists(select 1 from public.dlcs where id = p_item_id)
  end;
end;
$$;

create trigger dlcs_cleanup_related_rows after delete on public.dlcs
  for each row execute function public.cleanup_related_item_rows('dlc');

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
  g.notes,
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
  se.notes,
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
  sb.notes,
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
  ab.notes,
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
  f.notes,
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
  s.notes,
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
  d.notes,
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
