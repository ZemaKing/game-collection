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
