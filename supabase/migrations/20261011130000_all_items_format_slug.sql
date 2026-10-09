-- Phase 39 — Performance: `format_slug` computed field on all_items.
--
-- Cards show a Digital / Physical badge from the item's format tag. The client
-- used to fetch it with a second, serial request after every all_items query
-- (`withFormats`: item_tags?item_id=in.(…)), so listings, the dashboard,
-- search and related items waited one more round trip before rendering
-- (≈ 200–300 ms on a slow 4G phone, measured 2026-10-09). As a PostgREST
-- computed field it arrives in the same response.
--
-- The lookup is the item_tags primary key (item_type, item_id, tag_id).
-- The slugs are the app's FORMAT_TAG_SLUGS (src/features/items/constants.ts).
-- An item has at most one format tag; if it ever had both, the first slug
-- alphabetically wins (deterministic).
--
-- No view change, no row change. Re-runnable (`create or replace`).
--
-- Apply BEFORE deploying the app code that selects it (Phase 39 commit):
-- until then PostgREST answers that select with 400.

create or replace function public.format_slug(public.all_items)
returns text
language sql
stable
as $$
  select t.slug
  from public.item_tags it
  join public.tags t on t.id = it.tag_id
  where it.item_type = $1.item_type
    and it.item_id = $1.id
    and t.slug in ('digital', 'physical')
  order by t.slug
  limit 1
$$;

grant execute on function public.format_slug(public.all_items) to anon, authenticated;

-- Let PostgREST pick up the new computed field without a restart.
notify pgrst, 'reload schema';
