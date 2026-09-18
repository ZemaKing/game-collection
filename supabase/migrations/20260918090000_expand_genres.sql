-- Expand the genres lookup from 6 to 24 entries. Idempotent by slug so this
-- is safe to run against a database that already has the original 6 rows
-- (inserted outside of migrations) without touching their ids or any
-- existing game_genres links.

insert into public.genres (name, slug) values
  ('Shooter', 'shooter'),
  ('Racing', 'racing'),
  ('Sports', 'sports'),
  ('Fighting', 'fighting'),
  ('Horror', 'horror'),
  ('Survival', 'survival'),
  ('Puzzle', 'puzzle'),
  ('Platformer', 'platformer'),
  ('Stealth', 'stealth'),
  ('MMO', 'mmo'),
  ('Sandbox', 'sandbox'),
  ('Open World', 'open-world'),
  ('Card Game', 'card-game'),
  ('Rhythm / Music', 'rhythm-music'),
  ('Party', 'party'),
  ('Arcade', 'arcade'),
  ('Visual Novel', 'visual-novel'),
  ('Educational', 'educational')
on conflict (slug) do nothing;
