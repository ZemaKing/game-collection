-- Phase 34 — set_item_image_variants(): points item_images rows at their
-- WebP variants (or back at the originals) in ONE transaction. Used by
-- scripts/migrate-images/flip.ts (`npm run images:flip`), service role only.
--
-- p_rows: [{id, expected_storage_path, storage_path, thumb_path, width,
--           height, original_path}]. Every column is set exactly as given
-- (nulls included), so the same function flips and rolls back:
--   flip      storage_path = <row id>.webp, thumb_path = <row id>.thumb.webp,
--             width/height of the full WebP, original_path = the original
--   rollback  storage_path = original_path, the other four null
--
-- Guards (any failure changes nothing):
--   - every id must exist;
--   - every row's current storage_path must equal expected_storage_path, so a
--     row the owner changed after the plan was made is never overwritten.
-- A dry run reports the exact counts and rolls back.
--
-- Re-runnable: `create or replace function`.

create or replace function public.set_item_image_variants(
  p_rows jsonb,
  p_dry_run boolean default true
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_result jsonb;
  v_updated integer;
  v_missing text[];
  v_stale text[];
begin
  begin -- inner block: a dry run raises at its end, which rolls back everything done inside it
    select coalesce(array_agg(x.id::text), '{}') into v_missing
    from jsonb_to_recordset(p_rows) as x(id uuid)
    where not exists (select 1 from public.item_images i where i.id = x.id);
    if cardinality(v_missing) > 0 then
      raise exception 'set_item_image_variants: % unknown item_images id(s): %',
        cardinality(v_missing), array_to_string(v_missing[1:5], ', ');
    end if;

    select coalesce(array_agg(x.id::text), '{}') into v_stale
    from jsonb_to_recordset(p_rows) as x(id uuid, expected_storage_path text)
    join public.item_images i on i.id = x.id
    where i.storage_path is distinct from x.expected_storage_path;
    if cardinality(v_stale) > 0 then
      raise exception 'set_item_image_variants: % row(s) changed since the plan (storage_path differs): %',
        cardinality(v_stale), array_to_string(v_stale[1:5], ', ');
    end if;

    with src as (
      select * from jsonb_to_recordset(p_rows)
        as x(id uuid, storage_path text, thumb_path text, width integer, height integer, original_path text)
    ), upd as (
      update public.item_images i
      set storage_path = s.storage_path,
          thumb_path = s.thumb_path,
          width = s.width,
          height = s.height,
          original_path = s.original_path
      from src s
      where i.id = s.id
        and (i.storage_path, i.thumb_path, i.width, i.height, i.original_path)
            is distinct from (s.storage_path, s.thumb_path, s.width, s.height, s.original_path)
      returning i.id
    )
    select count(*) into v_updated from upd;

    v_result := jsonb_build_object(
      'rows', jsonb_array_length(p_rows),
      'updated', v_updated,
      'with_thumb', (select count(*) from public.item_images where thumb_path is not null),
      'with_original', (select count(*) from public.item_images where original_path is not null),
      'total', (select count(*) from public.item_images));

    if p_dry_run then
      raise exception using errcode = 'ZZ001', message = 'set_item_image_variants dry-run rollback';
    end if;
  exception
    when sqlstate 'ZZ001' then
      return v_result || jsonb_build_object('dry_run', true);
  end;

  return v_result || jsonb_build_object('dry_run', false);
end;
$$;

revoke all on function public.set_item_image_variants(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.set_item_image_variants(jsonb, boolean) to service_role;
