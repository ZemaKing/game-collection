-- Extensions and shared helper objects used by later migrations.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Enumerated types shared across item tables and polymorphic tables.
create type public.item_type as enum (
  'game',
  'special_edition',
  'steelbook',
  'artbook',
  'figure',
  'stuff'
);

create type public.item_status as enum (
  'owned',
  'wishlist'
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
-- backing item table. Used to validate item_images / item_relationships rows
-- since Postgres cannot express a native FK across a polymorphic union.
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
  end;
end;
$$;
