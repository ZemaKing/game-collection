-- Reference data for the game collection: platforms, genres and tags.
--
-- No sample items are seeded, so a fresh database starts as an empty
-- collection (games, DLCs, special editions, steelbooks, artbooks, figures and
-- stuff are all empty).
--
-- Idempotent: every row uses a fixed UUID (or conflicts on its slug) and is
-- upserted, so this file can be re-run safely against the same database at
-- any time.

begin;

-- ---------------------------------------------------------------------
-- Lookups: platforms, genres, tags
-- ---------------------------------------------------------------------

insert into public.platforms (id, name, slug) values
  ('00000000-0000-4000-8000-000000000001', 'PlayStation 5', 'playstation-5'),
  ('00000000-0000-4000-8000-000000000002', 'PlayStation 4', 'playstation-4'),
  ('00000000-0000-4000-8000-000000000003', 'Steam', 'steam'),
  ('00000000-0000-4000-8000-000000000004', 'Epic Games', 'epic-games'),
  ('00000000-0000-4000-8000-000000000005', 'Xbox', 'xbox')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

insert into public.genres (id, name, slug) values
  ('00000000-0000-4000-8000-000000000101', 'Action', 'action'),
  ('00000000-0000-4000-8000-000000000102', 'RPG', 'rpg'),
  ('00000000-0000-4000-8000-000000000103', 'Adventure', 'adventure'),
  ('00000000-0000-4000-8000-000000000104', 'Roguelike', 'roguelike'),
  ('00000000-0000-4000-8000-000000000105', 'Simulation', 'simulation'),
  ('00000000-0000-4000-8000-000000000106', 'Strategy', 'strategy'),
  ('00000000-0000-4000-8000-000000000107', 'Shooter', 'shooter'),
  ('00000000-0000-4000-8000-000000000108', 'Racing', 'racing'),
  ('00000000-0000-4000-8000-000000000109', 'Sports', 'sports'),
  ('00000000-0000-4000-8000-000000000110', 'Fighting', 'fighting'),
  ('00000000-0000-4000-8000-000000000111', 'Horror', 'horror'),
  ('00000000-0000-4000-8000-000000000112', 'Survival', 'survival'),
  ('00000000-0000-4000-8000-000000000113', 'Puzzle', 'puzzle'),
  ('00000000-0000-4000-8000-000000000114', 'Platformer', 'platformer'),
  ('00000000-0000-4000-8000-000000000115', 'Stealth', 'stealth'),
  ('00000000-0000-4000-8000-000000000116', 'MMO', 'mmo'),
  ('00000000-0000-4000-8000-000000000117', 'Sandbox', 'sandbox'),
  ('00000000-0000-4000-8000-000000000118', 'Open World', 'open-world'),
  ('00000000-0000-4000-8000-000000000119', 'Card Game', 'card-game'),
  ('00000000-0000-4000-8000-000000000120', 'Rhythm / Music', 'rhythm-music'),
  ('00000000-0000-4000-8000-000000000121', 'Party', 'party'),
  ('00000000-0000-4000-8000-000000000122', 'Arcade', 'arcade'),
  ('00000000-0000-4000-8000-000000000123', 'Visual Novel', 'visual-novel'),
  ('00000000-0000-4000-8000-000000000124', 'Educational', 'educational')
on conflict (slug) do update set name = excluded.name;

insert into public.tags (id, name, slug) values
  ('00000000-0000-4000-8000-000000000201', 'Favorite', 'favorite'),
  ('00000000-0000-4000-8000-000000000202', 'Limited Edition', 'limited-edition'),
  ('00000000-0000-4000-8000-000000000203', 'Digital', 'digital'),
  ('00000000-0000-4000-8000-000000000204', 'Physical', 'physical'),
  ('00000000-0000-4000-8000-000000000205', 'Day One Edition', 'day-one-edition'),
  ('00000000-0000-4000-8000-000000000206', 'Import', 'import')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

commit;
