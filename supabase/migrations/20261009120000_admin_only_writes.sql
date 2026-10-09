-- Phase 31 — Security Lockdown: writes are for the owner only.
--
-- Until now every write policy was `to authenticated using (true)`, so ANY
-- signed-in user (sign-ups were open) could edit or delete the whole
-- collection and every photo. This migration makes "only the owner can write"
-- true in the database:
--
-- 1. public.admin_users: the allow-list of user ids that may write. RLS on,
--    no API grants — it is managed in the SQL editor only.
-- 2. public.is_admin(): `security definer` so it can read admin_users without
--    exposing it; stable, search_path pinned.
-- 3. Every `*_owner_write` policy is replaced by `*_admin_write`
--    (`using (is_admin()) with check (is_admin())`). Public reads are unchanged.
-- 4. Storage bucket `item-images`: insert/update/delete for admins only. The
--    public SELECT policy is dropped — public URLs
--    (/storage/v1/object/public/...) don't go through RLS, so images still
--    load for everyone, but anon can no longer LIST the bucket. Admins keep a
--    SELECT policy because Storage needs it for remove() and upsert.
--
-- Re-runnable: everything is `if not exists` / `or replace` / dropped first.
--
-- After applying, add the owner (SQL editor):
--   insert into public.admin_users (user_id)
--   select id from auth.users where email = '<owner email>';

-- ---------------------------------------------------------------------
-- 1. Allow-list
-- ---------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- No policies and no grants: not readable or writable through the API at all.
revoke all on public.admin_users from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. is_admin()
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  )
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Table write policies
-- ---------------------------------------------------------------------

-- `(select public.is_admin())` is evaluated once per statement (initplan),
-- not once per row.
do $$
declare
  t text;
begin
  foreach t in array array[
    'games', 'special_editions', 'steelbooks', 'artbooks', 'figures', 'stuff',
    'dlcs', 'item_images', 'item_relationships', 'item_tags', 'game_genres',
    'tags', 'platforms', 'genres'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_owner_write', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format(
      'create policy %I on public.%I
         for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))',
      t || '_admin_write', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Storage bucket item-images
-- ---------------------------------------------------------------------

-- Limits unchanged for now (Phase 36 narrows the types to WebP); re-asserted
-- here so the live bucket is known to match.
update storage.buckets
set public = true,
    file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'item-images';

drop policy if exists "item_images_bucket_public_select" on storage.objects;
drop policy if exists "item_images_bucket_owner_write" on storage.objects;
drop policy if exists "item_images_bucket_admin_select" on storage.objects;
drop policy if exists "item_images_bucket_admin_insert" on storage.objects;
drop policy if exists "item_images_bucket_admin_update" on storage.objects;
drop policy if exists "item_images_bucket_admin_delete" on storage.objects;

create policy "item_images_bucket_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'item-images' and (select public.is_admin()));

create policy "item_images_bucket_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-images' and (select public.is_admin()));

create policy "item_images_bucket_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'item-images' and (select public.is_admin()))
  with check (bucket_id = 'item-images' and (select public.is_admin()));

create policy "item_images_bucket_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-images' and (select public.is_admin()));
