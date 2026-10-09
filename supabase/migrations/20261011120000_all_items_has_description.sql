-- Phase 39 — Performance: `has_description` computed field on all_items.
--
-- Cards and the statistics page only need to know WHETHER an item has a
-- description (the completeness score), but they selected the whole text:
-- `description` was ≈ 58 % of every all_items response (342 of 576 kB over
-- 433 rows, measured 2026-10-09). This adds a PostgREST computed field, the
-- same mechanism as title_search/subtitle_search, so the client can select
-- `has_description` instead and leave `description` to the detail page.
--
-- No view change, no row change. Re-runnable (`create or replace`).
--
-- Apply BEFORE deploying the app code that selects it (Phase 39 commit):
-- until then PostgREST answers that select with 400.

create or replace function public.has_description(public.all_items)
returns boolean
language sql
stable
as $$
  -- Same rule as the client's `!!row.description`: null and '' are "no description".
  select coalesce($1.description, '') <> ''
$$;

grant execute on function public.has_description(public.all_items) to anon, authenticated;

-- Let PostgREST pick up the new computed field without a restart.
notify pgrst, 'reload schema';
