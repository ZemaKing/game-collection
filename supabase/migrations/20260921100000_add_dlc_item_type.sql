-- DLCs / expansions become a seventh item type.
--
-- This migration only adds the enum value. Postgres cannot use a new enum
-- value in the same transaction that adds it, so everything that references
-- 'dlc' (the table, helper functions, the all_items view) lives in the next
-- migration, 20260921100100 — run that one as a separate query afterwards.

alter type public.item_type add value if not exists 'dlc';
