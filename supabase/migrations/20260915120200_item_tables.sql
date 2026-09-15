-- The six collection item tables. Each shares a common set of identity and
-- ownership columns plus columns specific to that item type.

create table public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform_id uuid references public.platforms(id) on delete set null,
  developer text,
  publisher text,
  region text,
  barcode text,
  external_ref text,
  release_date date,
  description text,
  status public.item_status not null default 'owned',
  collection_date date,
  value numeric(10, 2) check (value is null or value >= 0),
  currency char(3) not null default 'EUR',
  condition public.item_condition,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.special_editions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform_id uuid references public.platforms(id) on delete set null,
  edition_name text,
  region text,
  release_date date,
  description text,
  status public.item_status not null default 'owned',
  collection_date date,
  value numeric(10, 2) check (value is null or value >= 0),
  currency char(3) not null default 'EUR',
  condition public.item_condition,
  notes text,
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
  region text,
  release_date date,
  description text,
  status public.item_status not null default 'owned',
  collection_date date,
  value numeric(10, 2) check (value is null or value >= 0),
  currency char(3) not null default 'EUR',
  condition public.item_condition,
  notes text,
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
  status public.item_status not null default 'owned',
  collection_date date,
  value numeric(10, 2) check (value is null or value >= 0),
  currency char(3) not null default 'EUR',
  condition public.item_condition,
  notes text,
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
  status public.item_status not null default 'owned',
  collection_date date,
  value numeric(10, 2) check (value is null or value >= 0),
  currency char(3) not null default 'EUR',
  condition public.item_condition,
  notes text,
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
  status public.item_status not null default 'owned',
  collection_date date,
  value numeric(10, 2) check (value is null or value >= 0),
  currency char(3) not null default 'EUR',
  condition public.item_condition,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Games <-> genres (many-to-many). Genres are only modeled for games today;
-- other item types can gain a join table the same way if a future phase needs it.
create table public.game_genres (
  game_id uuid not null references public.games(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
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

-- Indexes for filtering/sorting/search.
create index games_status_idx on public.games(status);
create index games_platform_idx on public.games(platform_id);
create index games_release_date_idx on public.games(release_date);
create index games_created_at_idx on public.games(created_at);
create index games_title_trgm_idx on public.games using gin (title gin_trgm_ops);

create index special_editions_status_idx on public.special_editions(status);
create index special_editions_platform_idx on public.special_editions(platform_id);
create index special_editions_release_date_idx on public.special_editions(release_date);
create index special_editions_created_at_idx on public.special_editions(created_at);
create index special_editions_title_trgm_idx on public.special_editions using gin (title gin_trgm_ops);

create index steelbooks_status_idx on public.steelbooks(status);
create index steelbooks_platform_idx on public.steelbooks(platform_id);
create index steelbooks_release_date_idx on public.steelbooks(release_date);
create index steelbooks_created_at_idx on public.steelbooks(created_at);
create index steelbooks_title_trgm_idx on public.steelbooks using gin (title gin_trgm_ops);

create index artbooks_status_idx on public.artbooks(status);
create index artbooks_release_date_idx on public.artbooks(release_date);
create index artbooks_created_at_idx on public.artbooks(created_at);
create index artbooks_title_trgm_idx on public.artbooks using gin (title gin_trgm_ops);

create index figures_status_idx on public.figures(status);
create index figures_release_date_idx on public.figures(release_date);
create index figures_created_at_idx on public.figures(created_at);
create index figures_title_trgm_idx on public.figures using gin (title gin_trgm_ops);

create index stuff_status_idx on public.stuff(status);
create index stuff_release_date_idx on public.stuff(release_date);
create index stuff_created_at_idx on public.stuff(created_at);
create index stuff_title_trgm_idx on public.stuff using gin (title gin_trgm_ops);

create index item_tags_tag_idx on public.item_tags(tag_id);

-- RLS: public can read every item table; only the authenticated owner can write.
alter table public.games enable row level security;
alter table public.special_editions enable row level security;
alter table public.steelbooks enable row level security;
alter table public.artbooks enable row level security;
alter table public.figures enable row level security;
alter table public.stuff enable row level security;
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

create policy "game_genres_public_select" on public.game_genres for select to anon, authenticated using (true);
create policy "game_genres_owner_write" on public.game_genres for all to authenticated using (true) with check (true);

create policy "item_tags_public_select" on public.item_tags for select to anon, authenticated using (true);
create policy "item_tags_owner_write" on public.item_tags for all to authenticated using (true) with check (true);
