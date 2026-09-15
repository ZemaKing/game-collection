-- Dev/sample data for the game collection.
--
-- Idempotent: every row uses a fixed UUID and is upserted (ON CONFLICT ...
-- DO UPDATE / DO NOTHING), so this file can be re-run safely against the
-- same database at any time.
--
-- Image rows reference storage_path values under a "seed/" prefix. No
-- Storage bucket or objects are created here (that's Phase 14) - the paths
-- are placeholders so gallery/cover UI has representative data to render
-- against once Storage is wired up; until then, expect broken-image
-- fallback states (Phase 22) to be visible for these rows.

begin;

-- ---------------------------------------------------------------------
-- Lookups: platforms, genres, tags
-- ---------------------------------------------------------------------

insert into public.platforms (id, name, slug) values
  ('00000000-0000-4000-8000-000000000001', 'PlayStation 5', 'playstation-5'),
  ('00000000-0000-4000-8000-000000000002', 'PlayStation 4', 'playstation-4'),
  ('00000000-0000-4000-8000-000000000003', 'Steam', 'steam'),
  ('00000000-0000-4000-8000-000000000004', 'Epic Games', 'epic-games')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

insert into public.genres (id, name, slug) values
  ('00000000-0000-4000-8000-000000000101', 'Action', 'action'),
  ('00000000-0000-4000-8000-000000000102', 'RPG', 'rpg'),
  ('00000000-0000-4000-8000-000000000103', 'Adventure', 'adventure'),
  ('00000000-0000-4000-8000-000000000104', 'Roguelike', 'roguelike'),
  ('00000000-0000-4000-8000-000000000105', 'Simulation', 'simulation'),
  ('00000000-0000-4000-8000-000000000106', 'Strategy', 'strategy')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

insert into public.tags (id, name, slug) values
  ('00000000-0000-4000-8000-000000000201', 'Favorite', 'favorite'),
  ('00000000-0000-4000-8000-000000000202', 'Limited Edition', 'limited-edition'),
  ('00000000-0000-4000-8000-000000000203', 'Digital', 'digital'),
  ('00000000-0000-4000-8000-000000000204', 'Physical', 'physical'),
  ('00000000-0000-4000-8000-000000000205', 'Day One Edition', 'day-one-edition'),
  ('00000000-0000-4000-8000-000000000206', 'Import', 'import')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

-- ---------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------

insert into public.games
  (id, title, platform_id, developer, publisher, region, barcode, release_date, description,
   status, collection_date, value, currency, condition, notes, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000001001', 'God of War Ragnarök',
   '00000000-0000-4000-8000-000000000001', 'Santa Monica Studio', 'Sony Interactive Entertainment',
   'EU', '711719574028', '2022-11-09',
   'Kratos and Atreus journey across the Norse realms as Fimbulwinter approaches.',
   'owned', '2026-08-20', 69.99, 'EUR', 'mint', 'Bought new on release week restock.',
   now() - interval '25 days', now() - interval '25 days'),

  ('00000000-0000-4000-8000-000000001002', 'Elden Ring',
   '00000000-0000-4000-8000-000000000001', 'FromSoftware', 'Bandai Namco',
   'EU', '3391892022942', '2022-02-25',
   'An open-world action RPG set in the Lands Between.',
   'owned', '2026-06-01', 49.99, 'EUR', 'good', null,
   now() - interval '100 days', now() - interval '100 days'),

  ('00000000-0000-4000-8000-000000001003', 'Elden Ring',
   '00000000-0000-4000-8000-000000000003', 'FromSoftware', 'Bandai Namco',
   null, null, '2022-02-25',
   'PC copy, kept separate from the PS5 disc copy - same title, legitimate second platform.',
   'owned', '2026-02-10', 39.99, 'EUR', 'sealed', 'Digital re-purchase for Steam Deck.',
   now() - interval '210 days', now() - interval '210 days'),

  ('00000000-0000-4000-8000-000000001004', 'Hades',
   '00000000-0000-4000-8000-000000000003', 'Supergiant Games', 'Supergiant Games',
   null, null, '2020-09-17', 'A rogue-like dungeon crawler set in Greek myth.',
   'owned', '2026-09-01', 19.99, 'EUR', 'sealed', null,
   now() - interval '10 days', now() - interval '10 days'),

  ('00000000-0000-4000-8000-000000001005', 'Stardew Valley',
   '00000000-0000-4000-8000-000000000003', 'ConcernedApe', 'ConcernedApe',
   null, null, '2016-02-26', null,
   'wishlist', null, 14.99, 'EUR', null, null,
   now() - interval '5 days', now() - interval '5 days'),

  ('00000000-0000-4000-8000-000000001006', 'Horizon Forbidden West',
   '00000000-0000-4000-8000-000000000002', 'Guerrilla Games', 'Sony Interactive Entertainment',
   'EU', '711719408651', '2022-02-18',
   'Aloy ventures into a majestic but dangerous frontier.',
   'owned', '2025-03-12', 29.99, 'EUR', 'good', 'Disc has minor surface scratches.',
   now() - interval '340 days', now() - interval '340 days'),

  ('00000000-0000-4000-8000-000000001007', 'Baldur''s Gate 3',
   '00000000-0000-4000-8000-000000000004', 'Larian Studios', 'Larian Studios',
   null, null, '2023-08-03', 'A party-based RPG set in the Forgotten Realms.',
   'wishlist', null, 59.99, 'EUR', null, 'Waiting for a sale.',
   now() - interval '3 days', now() - interval '3 days'),

  ('00000000-0000-4000-8000-000000001008', 'God of War Ragnarok',
   '00000000-0000-4000-8000-000000000002', 'Santa Monica Studio', 'Sony Interactive Entertainment',
   'US', '711719574011', '2022-11-09', null,
   'wishlist', null, null, 'EUR', null,
   'Near-duplicate of the PS5 copy (no diacritic, PS4 version) - for duplicate-detection testing.',
   now() - interval '1 days', now() - interval '1 days')
on conflict (id) do update set
  title = excluded.title, platform_id = excluded.platform_id, developer = excluded.developer,
  publisher = excluded.publisher, region = excluded.region, barcode = excluded.barcode,
  release_date = excluded.release_date, description = excluded.description, status = excluded.status,
  collection_date = excluded.collection_date, value = excluded.value, currency = excluded.currency,
  condition = excluded.condition, notes = excluded.notes;

insert into public.game_genres (game_id, genre_id) values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000103'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000000104'),
  ('00000000-0000-4000-8000-000000001005', '00000000-0000-4000-8000-000000000105'),
  ('00000000-0000-4000-8000-000000001006', '00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000001006', '00000000-0000-4000-8000-000000000103'),
  ('00000000-0000-4000-8000-000000001007', '00000000-0000-4000-8000-000000000102')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Special edition (Game -> Special Edition -> Steelbook/Artbook/Figure)
-- ---------------------------------------------------------------------

insert into public.special_editions
  (id, title, platform_id, edition_name, region, release_date, description,
   status, collection_date, value, currency, condition, notes, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000002001', 'God of War Ragnarök — Collector''s Edition',
   '00000000-0000-4000-8000-000000000001', 'Collector''s Edition', 'EU', '2022-11-09',
   'Includes the base game, steelbook case, art book, and a Kratos & Atreus figure.',
   'owned', '2026-08-20', 249.99, 'EUR', 'mint', 'Display piece, kept sealed apart from the disc.',
   now() - interval '25 days', now() - interval '25 days')
on conflict (id) do update set
  title = excluded.title, platform_id = excluded.platform_id, edition_name = excluded.edition_name,
  region = excluded.region, release_date = excluded.release_date, description = excluded.description,
  status = excluded.status, collection_date = excluded.collection_date, value = excluded.value,
  currency = excluded.currency, condition = excluded.condition, notes = excluded.notes;

-- ---------------------------------------------------------------------
-- Steelbooks
-- ---------------------------------------------------------------------

insert into public.steelbooks
  (id, title, platform_id, game_title, edition_name, steelbook_number, region, release_date,
   description, status, collection_date, value, currency, condition, notes, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000003001', 'God of War Ragnarök Steelbook',
   '00000000-0000-4000-8000-000000000001', 'God of War Ragnarök', 'Collector''s Edition', null,
   'EU', '2022-11-09', 'Steelbook case included with the Collector''s Edition.',
   'owned', '2026-08-20', null, 'EUR', 'mint', null,
   now() - interval '25 days', now() - interval '25 days'),

  ('00000000-0000-4000-8000-000000003002', 'Horizon Forbidden West Steelbook',
   '00000000-0000-4000-8000-000000000002', 'Horizon Forbidden West', 'Launch Edition', 'G2',
   'EU', '2022-02-18', null,
   'owned', '2025-03-12', 12.00, 'EUR', 'good', 'Bought separately from a retailer promo.',
   now() - interval '340 days', now() - interval '340 days')
on conflict (id) do update set
  title = excluded.title, platform_id = excluded.platform_id, game_title = excluded.game_title,
  edition_name = excluded.edition_name, steelbook_number = excluded.steelbook_number,
  region = excluded.region, release_date = excluded.release_date, description = excluded.description,
  status = excluded.status, collection_date = excluded.collection_date, value = excluded.value,
  currency = excluded.currency, condition = excluded.condition, notes = excluded.notes;

-- ---------------------------------------------------------------------
-- Artbooks
-- ---------------------------------------------------------------------

insert into public.artbooks
  (id, title, publisher, page_count, isbn, language, release_date, description,
   status, collection_date, value, currency, condition, notes, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000004001', 'The Art of God of War Ragnarök',
   'Dark Horse Books', 232, '978-1506727820', 'English', '2022-11-09',
   'Concept art book included with the Collector''s Edition.',
   'owned', '2026-08-20', null, 'EUR', 'mint', null,
   now() - interval '25 days', now() - interval '25 days'),

  ('00000000-0000-4000-8000-000000004002', 'Horizon Forbidden West: The Complete Art',
   'Titan Books', 264, '978-1789097461', 'English', '2022-03-01', null,
   'wishlist', null, 34.99, 'EUR', null, null,
   now() - interval '7 days', now() - interval '7 days')
on conflict (id) do update set
  title = excluded.title, publisher = excluded.publisher, page_count = excluded.page_count,
  isbn = excluded.isbn, language = excluded.language, release_date = excluded.release_date,
  description = excluded.description, status = excluded.status, collection_date = excluded.collection_date,
  value = excluded.value, currency = excluded.currency, condition = excluded.condition, notes = excluded.notes;

-- ---------------------------------------------------------------------
-- Figures
-- ---------------------------------------------------------------------

insert into public.figures
  (id, title, manufacturer, character_name, scale, material, height_cm, release_date,
   description, status, collection_date, value, currency, condition, notes, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000005001', 'Kratos & Atreus Figure',
   'Sony Interactive Entertainment', 'Kratos & Atreus', null, 'PVC', 18.50, '2022-11-09',
   'Figure included with the Collector''s Edition.',
   'owned', '2026-08-20', null, 'EUR', 'mint', 'Favorite Photo alongside the steelbook.',
   now() - interval '25 days', now() - interval '25 days'),

  ('00000000-0000-4000-8000-000000005002', 'Geralt of Rivia Figure',
   'Dark Horse', 'Geralt of Rivia', '1/7', 'PVC', 27.00, '2021-06-15', null,
   'wishlist', null, 89.99, 'EUR', null, null,
   now() - interval '2 days', now() - interval '2 days')
on conflict (id) do update set
  title = excluded.title, manufacturer = excluded.manufacturer, character_name = excluded.character_name,
  scale = excluded.scale, material = excluded.material, height_cm = excluded.height_cm,
  release_date = excluded.release_date, description = excluded.description, status = excluded.status,
  collection_date = excluded.collection_date, value = excluded.value, currency = excluded.currency,
  condition = excluded.condition, notes = excluded.notes;

-- ---------------------------------------------------------------------
-- Stuff
-- ---------------------------------------------------------------------

insert into public.stuff
  (id, title, category, manufacturer, release_date, description,
   status, collection_date, value, currency, condition, notes, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000006001', 'PS5 DualSense Controller (Midnight Black)',
   'Accessory', 'Sony Interactive Entertainment', '2020-11-12', null,
   'owned', '2026-01-15', 64.99, 'EUR', 'good', 'Second controller for co-op.',
   now() - interval '240 days', now() - interval '240 days'),

  ('00000000-0000-4000-8000-000000006002', 'Elden Ring Poster',
   'Poster', 'Bandai Namco', '2022-02-25', null,
   'wishlist', null, 9.99, 'EUR', null, null,
   now() - interval '4 days', now() - interval '4 days')
on conflict (id) do update set
  title = excluded.title, category = excluded.category, manufacturer = excluded.manufacturer,
  release_date = excluded.release_date, description = excluded.description, status = excluded.status,
  collection_date = excluded.collection_date, value = excluded.value, currency = excluded.currency,
  condition = excluded.condition, notes = excluded.notes;

-- ---------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------

insert into public.item_tags (item_type, item_id, tag_id) values
  ('game', '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000201'),
  ('game', '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000204'),
  ('game', '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000205'),
  ('game', '00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000203'),
  ('game', '00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000000203'),
  ('special_edition', '00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000000202'),
  ('special_edition', '00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000000204'),
  ('steelbook', '00000000-0000-4000-8000-000000003001', '00000000-0000-4000-8000-000000000204'),
  ('figure', '00000000-0000-4000-8000-000000005001', '00000000-0000-4000-8000-000000000201')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Item relationships
-- Game -> Special Edition -> (Steelbook, Artbook, Figure)
-- ---------------------------------------------------------------------

insert into public.item_relationships (id, parent_type, parent_id, child_type, child_id, relationship_type) values
  ('00000000-0000-4000-8000-000000008001', 'game', '00000000-0000-4000-8000-000000001001',
   'special_edition', '00000000-0000-4000-8000-000000002001', 'special_edition'),
  ('00000000-0000-4000-8000-000000008002', 'special_edition', '00000000-0000-4000-8000-000000002001',
   'steelbook', '00000000-0000-4000-8000-000000003001', 'contains'),
  ('00000000-0000-4000-8000-000000008003', 'special_edition', '00000000-0000-4000-8000-000000002001',
   'artbook', '00000000-0000-4000-8000-000000004001', 'contains'),
  ('00000000-0000-4000-8000-000000008004', 'special_edition', '00000000-0000-4000-8000-000000002001',
   'figure', '00000000-0000-4000-8000-000000005001', 'contains')
on conflict (id) do update set
  parent_type = excluded.parent_type, parent_id = excluded.parent_id,
  child_type = excluded.child_type, child_id = excluded.child_id,
  relationship_type = excluded.relationship_type;

-- ---------------------------------------------------------------------
-- Images (cover + gallery). Paths are placeholders until Phase 14 wires up
-- Supabase Storage; see file header.
-- ---------------------------------------------------------------------

insert into public.item_images (id, item_type, item_id, storage_path, position, is_cover, alt_text) values
  ('00000000-0000-4000-8000-000000007001', 'game', '00000000-0000-4000-8000-000000001001',
   'seed/games/god-of-war-ragnarok/cover.jpg', 0, true, 'God of War Ragnarök cover art'),
  ('00000000-0000-4000-8000-000000007002', 'game', '00000000-0000-4000-8000-000000001001',
   'seed/games/god-of-war-ragnarok/gallery-1.jpg', 1, false, 'Disc and case on the shelf'),
  ('00000000-0000-4000-8000-000000007003', 'game', '00000000-0000-4000-8000-000000001002',
   'seed/games/elden-ring/cover.jpg', 0, true, 'Elden Ring cover art'),
  ('00000000-0000-4000-8000-000000007004', 'game', '00000000-0000-4000-8000-000000001004',
   'seed/games/hades/cover.jpg', 0, true, 'Hades cover art'),
  ('00000000-0000-4000-8000-000000007005', 'game', '00000000-0000-4000-8000-000000001006',
   'seed/games/horizon-forbidden-west/cover.jpg', 0, true, 'Horizon Forbidden West cover art'),
  ('00000000-0000-4000-8000-000000007006', 'special_edition', '00000000-0000-4000-8000-000000002001',
   'seed/special-editions/god-of-war-ragnarok-collectors/cover.jpg', 0, true, 'Collector''s Edition box'),
  ('00000000-0000-4000-8000-000000007007', 'special_edition', '00000000-0000-4000-8000-000000002001',
   'seed/special-editions/god-of-war-ragnarok-collectors/gallery-1.jpg', 1, false, 'Unboxed contents laid out'),
  ('00000000-0000-4000-8000-000000007008', 'special_edition', '00000000-0000-4000-8000-000000002001',
   'seed/special-editions/god-of-war-ragnarok-collectors/gallery-2.jpg', 2, false, 'Figure close-up'),
  ('00000000-0000-4000-8000-000000007009', 'steelbook', '00000000-0000-4000-8000-000000003001',
   'seed/steelbooks/god-of-war-ragnarok/cover.jpg', 0, true, 'God of War Ragnarök steelbook front'),
  ('00000000-0000-4000-8000-00000000700a', 'artbook', '00000000-0000-4000-8000-000000004001',
   'seed/artbooks/art-of-god-of-war-ragnarok/cover.jpg', 0, true, 'The Art of God of War Ragnarök cover'),
  ('00000000-0000-4000-8000-00000000700b', 'figure', '00000000-0000-4000-8000-000000005001',
   'seed/figures/kratos-atreus/cover.jpg', 0, true, 'Kratos & Atreus figure'),
  ('00000000-0000-4000-8000-00000000700c', 'stuff', '00000000-0000-4000-8000-000000006001',
   'seed/stuff/dualsense-midnight-black/cover.jpg', 0, true, 'DualSense controller, Midnight Black')
on conflict (id) do update set
  item_type = excluded.item_type, item_id = excluded.item_id, storage_path = excluded.storage_path,
  position = excluded.position, is_cover = excluded.is_cover, alt_text = excluded.alt_text;

commit;
