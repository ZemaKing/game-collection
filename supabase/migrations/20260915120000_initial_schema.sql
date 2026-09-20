-- Baseline schema for the game collection.
--
-- This single file replaces the incremental migrations that built the schema
-- up to this point (extensions/helpers, lookup tables, item tables, images,
-- relationships, the all_items view, dropping status/pricing, the images
-- storage bucket, the genre expansion and ordering, edition, completed,
-- dropping region/barcode, DLCs, and dropping notes). It creates the FINAL
-- schema directly, so it is meant for a NEW database. A database that already
-- ran the old chain is already at this schema and must not run it again.
--
-- Seven item types, each with its own table: games, special_editions,
-- steelbooks, artbooks, figures, stuff and dlcs. A DLC cannot exist without a
-- base game (dlcs.game_id is NOT NULL, ON DELETE CASCADE).
--
-- Reference data: the 18 genres added by the old "expand genres" migration are
-- inserted below. The original six (Action, RPG, Adventure, Roguelike,
-- Simulation, Strategy) come from supabase/seed.sql, as before.

-- ---------------------------------------------------------------------
-- Extensions, enums and shared helpers
-- ---------------------------------------------------------------------

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.item_type as enum (
  'game',
  'special_edition',
  'steelbook',
  'artbook',
  'figure',
  'stuff',
  'dlc'
);

create type public.item_condition as enum (
  'sealed',
  'mint',
  'good',
  'fair',
  'poor'
);

-- Generic updated_at maintenance trigger, attached to every mutable table.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Resolves whether a polymorphic (item_type, item_id) pair exists in its
-- backing item table. Used to validate item_images / item_tags /
-- item_relationships rows since Postgres cannot express a native FK across a
-- polymorphic union.
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

-- ---------------------------------------------------------------------
-- Lookup tables: platforms, genres, tags
-- ---------------------------------------------------------------------

create table public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.platforms enable row level security;
alter table public.genres enable row level security;
alter table public.tags enable row level security;

create policy "platforms_public_select" on public.platforms
  for select to anon, authenticated using (true);
create policy "platforms_owner_write" on public.platforms
  for all to authenticated using (true) with check (true);

create policy "genres_public_select" on public.genres
  for select to anon, authenticated using (true);
create policy "genres_owner_write" on public.genres
  for all to authenticated using (true) with check (true);

create policy "tags_public_select" on public.tags
  for select to anon, authenticated using (true);
create policy "tags_owner_write" on public.tags
  for all to authenticated using (true) with check (true);

-- Genres beyond the original six. Idempotent by slug.
insert into public.genres (name, slug) values
  ('Shooter', 'shooter'),
  ('Racing', 'racing'),
  ('Sports', 'sports'),
  ('Fighting', 'fighting'),
  ('Horror', 'horror'),
  ('Survival', 'survival'),
  ('Puzzle', 'puzzle'),
  ('Platformer', 'platformer'),
  ('Stealth', 'stealth'),
  ('MMO', 'mmo'),
  ('Sandbox', 'sandbox'),
  ('Open World', 'open-world'),
  ('Card Game', 'card-game'),
  ('Rhythm / Music', 'rhythm-music'),
  ('Party', 'party'),
  ('Arcade', 'arcade'),
  ('Visual Novel', 'visual-novel'),
  ('Educational', 'educational')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Item tables. Each shares a common set of identity and ownership columns
-- plus columns specific to that item type.
-- ---------------------------------------------------------------------

create table public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform_id uuid references public.platforms(id) on delete set null,
  developer text,
  publisher text,
  edition_name text,
  external_ref text,
  release_date date,
  description text,
  collection_date date,
  condition public.item_condition,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.special_editions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform_id uuid references public.platforms(id) on delete set null,
  edition_name text,
  release_date date,
  description text,
  collection_date date,
  condition public.item_condition,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.steelbooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform_id uuid references public.platforms(id) on delete set null,
  game_title text,
  edition_name text,
  steelbook_number text,
  release_date date,
  description text,
  collection_date date,
  condition public.item_condition,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artbooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text,
  page_count integer check (page_count is null or page_count > 0),
  isbn text,
  language text,
  release_date date,
  description text,
  collection_date date,
  condition public.item_condition,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.figures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  manufacturer text,
  character_name text,
  scale text,
  material text,
  height_cm numeric(6, 2) check (height_cm is null or height_cm > 0),
  release_date date,
  description text,
  collection_date date,
  condition public.item_condition,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stuff (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  manufacturer text,
  release_date date,
  description text,
  collection_date date,
  condition public.item_condition,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DLCs / expansions. A DLC cannot outlive its game: deleting a game removes
-- its DLC rows. It has no platform or genre of its own — all_items takes both
-- from the base game.
create table public.dlcs (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  title text not null,
  dlc_type text not null default 'dlc' check (dlc_type in ('dlc', 'expansion')),
  release_date date,
  description text,
  collection_date date,
  condition public.item_condition,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Games <-> genres (many-to-many). `position` orders a game's genres: the
-- first genre picked in the form (or returned by RAWG autofill) is genre #0,
-- the "primary" genre used by cards.
create table public.game_genres (
  game_id uuid not null references public.games(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  position smallint not null default 0,
  primary key (game_id, genre_id)
);

-- Tags are free-form and apply across every item type, so they are keyed
-- polymorphically the same way item_images and item_relationships are.
create table public.item_tags (
  item_type public.item_type not null,
  item_id uuid not null,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_type, item_id, tag_id)
);

create or replace function public.validate_item_tags_reference()
returns trigger
language plpgsql
as $$
begin
  if not public.item_reference_exists(new.item_type, new.item_id) then
    raise exception 'item_tags.item_id % does not exist for item_type %', new.item_id, new.item_type;
  end if;
  return new;
end;
$$;

create trigger item_tags_validate_reference
  before insert or update on public.item_tags
  for each row execute function public.validate_item_tags_reference();

-- updated_at triggers
create trigger games_set_updated_at before update on public.games
  for each row execute function public.set_updated_at();
create trigger special_editions_set_updated_at before update on public.special_editions
  for each row execute function public.set_updated_at();
create trigger steelbooks_set_updated_at before update on public.steelbooks
  for each row execute function public.set_updated_at();
create trigger artbooks_set_updated_at before update on public.artbooks
  for each row execute function public.set_updated_at();
create trigger figures_set_updated_at before update on public.figures
  for each row execute function public.set_updated_at();
create trigger stuff_set_updated_at before update on public.stuff
  for each row execute function public.set_updated_at();
create trigger dlcs_set_updated_at before update on public.dlcs
  for each row execute function public.set_updated_at();

-- Indexes for filtering/sorting/search.
create index games_platform_idx on public.games(platform_id);
create index games_release_date_idx on public.games(release_date);
create index games_created_at_idx on public.games(created_at);
create index games_title_trgm_idx on public.games using gin (title gin_trgm_ops);

create index special_editions_platform_idx on public.special_editions(platform_id);
create index special_editions_release_date_idx on public.special_editions(release_date);
create index special_editions_created_at_idx on public.special_editions(created_at);
create index special_editions_title_trgm_idx on public.special_editions using gin (title gin_trgm_ops);

create index steelbooks_platform_idx on public.steelbooks(platform_id);
create index steelbooks_release_date_idx on public.steelbooks(release_date);
create index steelbooks_created_at_idx on public.steelbooks(created_at);
create index steelbooks_title_trgm_idx on public.steelbooks using gin (title gin_trgm_ops);

create index artbooks_release_date_idx on public.artbooks(release_date);
create index artbooks_created_at_idx on public.artbooks(created_at);
create index artbooks_title_trgm_idx on public.artbooks using gin (title gin_trgm_ops);

create index figures_release_date_idx on public.figures(release_date);
create index figures_created_at_idx on public.figures(created_at);
create index figures_title_trgm_idx on public.figures using gin (title gin_trgm_ops);

create index stuff_release_date_idx on public.stuff(release_date);
create index stuff_created_at_idx on public.stuff(created_at);
create index stuff_title_trgm_idx on public.stuff using gin (title gin_trgm_ops);

create index dlcs_game_idx on public.dlcs(game_id);
create index dlcs_release_date_idx on public.dlcs(release_date);
create index dlcs_created_at_idx on public.dlcs(created_at);
create index dlcs_title_trgm_idx on public.dlcs using gin (title gin_trgm_ops);

create index item_tags_tag_idx on public.item_tags(tag_id);

-- RLS: public can read every item table; only the authenticated owner can write.
alter table public.games enable row level security;
alter table public.special_editions enable row level security;
alter table public.steelbooks enable row level security;
alter table public.artbooks enable row level security;
alter table public.figures enable row level security;
alter table public.stuff enable row level security;
alter table public.dlcs enable row level security;
alter table public.game_genres enable row level security;
alter table public.item_tags enable row level security;

create policy "games_public_select" on public.games for select to anon, authenticated using (true);
create policy "games_owner_write" on public.games for all to authenticated using (true) with check (true);

create policy "special_editions_public_select" on public.special_editions for select to anon, authenticated using (true);
create policy "special_editions_owner_write" on public.special_editions for all to authenticated using (true) with check (true);

create policy "steelbooks_public_select" on public.steelbooks for select to anon, authenticated using (true);
create policy "steelbooks_owner_write" on public.steelbooks for all to authenticated using (true) with check (true);

create policy "artbooks_public_select" on public.artbooks for select to anon, authenticated using (true);
create policy "artbooks_owner_write" on public.artbooks for all to authenticated using (true) with check (true);

create policy "figures_public_select" on public.figures for select to anon, authenticated using (true);
create policy "figures_owner_write" on public.figures for all to authenticated using (true) with check (true);

create policy "stuff_public_select" on public.stuff for select to anon, authenticated using (true);
create policy "stuff_owner_write" on public.stuff for all to authenticated using (true) with check (true);

create policy "dlcs_public_select" on public.dlcs for select to anon, authenticated using (true);
create policy "dlcs_owner_write" on public.dlcs for all to authenticated using (true) with check (true);

create policy "game_genres_public_select" on public.game_genres for select to anon, authenticated using (true);
create policy "game_genres_owner_write" on public.game_genres for all to authenticated using (true) with check (true);

create policy "item_tags_public_select" on public.item_tags for select to anon, authenticated using (true);
create policy "item_tags_owner_write" on public.item_tags for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- Images
-- ---------------------------------------------------------------------

-- Shared, polymorphic image table for every item type's cover + gallery.

create table public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_type public.item_type not null,
  item_id uuid not null,
  storage_path text not null,
  position integer not null default 0,
  is_cover boolean not null default false,
  alt_text text,
  created_at timestamptz not null default now()
);

create or replace function public.validate_item_images_reference()
returns trigger
language plpgsql
as $$
begin
  if not public.item_reference_exists(new.item_type, new.item_id) then
    raise exception 'item_images.item_id % does not exist for item_type %', new.item_id, new.item_type;
  end if;
  return new;
end;
$$;

create trigger item_images_validate_reference
  before insert or update on public.item_images
  for each row execute function public.validate_item_images_reference();

create index item_images_item_idx on public.item_images(item_type, item_id);
create index item_images_item_position_idx on public.item_images(item_type, item_id, position);

-- At most one cover image per item.
create unique index item_images_one_cover_per_item
  on public.item_images(item_type, item_id)
  where is_cover;

alter table public.item_images enable row level security;

create policy "item_images_public_select" on public.item_images
  for select to anon, authenticated using (true);
create policy "item_images_owner_write" on public.item_images
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- Relationships
-- ---------------------------------------------------------------------

-- Parent/child and related-item links, e.g. Game -> Special Edition -> Steelbook/Artbook/Figure.

create table public.item_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_type public.item_type not null,
  parent_id uuid not null,
  child_type public.item_type not null,
  child_id uuid not null,
  relationship_type text not null default 'related',
  created_at timestamptz not null default now(),
  constraint item_relationships_no_self_reference
    check (parent_type <> child_type or parent_id <> child_id),
  constraint item_relationships_unique_link
    unique (parent_type, parent_id, child_type, child_id)
);

create or replace function public.validate_item_relationships_reference()
returns trigger
language plpgsql
as $$
begin
  if not public.item_reference_exists(new.parent_type, new.parent_id) then
    raise exception 'item_relationships.parent_id % does not exist for parent_type %', new.parent_id, new.parent_type;
  end if;
  if not public.item_reference_exists(new.child_type, new.child_id) then
    raise exception 'item_relationships.child_id % does not exist for child_type %', new.child_id, new.child_type;
  end if;
  return new;
end;
$$;

create trigger item_relationships_validate_reference
  before insert or update on public.item_relationships
  for each row execute function public.validate_item_relationships_reference();

create index item_relationships_parent_idx on public.item_relationships(parent_type, parent_id);
create index item_relationships_child_idx on public.item_relationships(child_type, child_id);

alter table public.item_relationships enable row level security;

create policy "item_relationships_public_select" on public.item_relationships
  for select to anon, authenticated using (true);
create policy "item_relationships_owner_write" on public.item_relationships
  for all to authenticated using (true) with check (true);

-- Cascade cleanup: deleting an item row removes its images and any
-- relationship rows that reference it, since polymorphic references cannot
-- use a native FK/ON DELETE CASCADE.
create or replace function public.cleanup_related_item_rows()
returns trigger
language plpgsql
as $$
declare
  v_item_type public.item_type := TG_ARGV[0]::public.item_type;
begin
  delete from public.item_images
    where item_type = v_item_type and item_id = old.id;
  delete from public.item_relationships
    where (parent_type = v_item_type and parent_id = old.id)
       or (child_type = v_item_type and child_id = old.id);
  delete from public.item_tags
    where item_type = v_item_type and item_id = old.id;
  return old;
end;
$$;

create trigger games_cleanup_related_rows after delete on public.games
  for each row execute function public.cleanup_related_item_rows('game');
create trigger special_editions_cleanup_related_rows after delete on public.special_editions
  for each row execute function public.cleanup_related_item_rows('special_edition');
create trigger steelbooks_cleanup_related_rows after delete on public.steelbooks
  for each row execute function public.cleanup_related_item_rows('steelbook');
create trigger artbooks_cleanup_related_rows after delete on public.artbooks
  for each row execute function public.cleanup_related_item_rows('artbook');
create trigger figures_cleanup_related_rows after delete on public.figures
  for each row execute function public.cleanup_related_item_rows('figure');
create trigger stuff_cleanup_related_rows after delete on public.stuff
  for each row execute function public.cleanup_related_item_rows('stuff');
create trigger dlcs_cleanup_related_rows after delete on public.dlcs
  for each row execute function public.cleanup_related_item_rows('dlc');

-- ---------------------------------------------------------------------
-- all_items: one row per item across every type, backing listing/search.
-- A DLC's platform, genre and subtitle come from its base game;
-- parent_game_id is that game's id (null for every other type).
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- Storage bucket for item cover/gallery photos
-- ---------------------------------------------------------------------

-- Storage bucket for item cover/gallery photos. Public bucket (public
-- read via the /object/public/ endpoint, no auth needed to view — matches
-- every other table's public-read policy) with owner-only writes.
--
-- RLS is already enabled on storage.objects by default in Supabase; this
-- only adds policies scoped to this bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "item_images_bucket_public_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'item-images');

create policy "item_images_bucket_owner_write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'item-images')
  with check (bucket_id = 'item-images');
