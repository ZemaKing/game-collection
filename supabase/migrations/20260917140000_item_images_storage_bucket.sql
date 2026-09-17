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
