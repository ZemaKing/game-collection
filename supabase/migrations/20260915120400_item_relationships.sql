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
