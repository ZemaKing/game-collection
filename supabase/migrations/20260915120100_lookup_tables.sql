-- Lookup tables: platforms, genres, tags.

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
