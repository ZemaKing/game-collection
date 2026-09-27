-- Forgiving title/subtitle search.
--
-- Adds `search_normalize(text)` and two PostgREST computed fields on the
-- all_items view, `title_search` and `subtitle_search`, that the client
-- filters with one `ilike '%token%'` per typed word (see
-- src/features/search/searchQuery.ts, which tokenizes the query the same way).
--
-- The normalized text holds several spellings of the same title so a plain
-- substring match per token covers:
--   * punctuation:  "F.I.S.T.: Forged In Shadow Torch" -> "fist forged in shadow torch"
--                   (apostrophes and dots are dropped, anything else non-alphanumeric
--                   becomes a space; accents are stripped with unaccent)
--   * hyphens:      "Spider-Man" -> "spider man" and "spiderman"
--   * numerals:     "Civilization VI" also yields "civilization 6" (and "2" yields "ii"),
--                   for standalone Roman numerals I..XXXIX / numbers 1..39
--   * acronyms:     word initials, numbers kept whole: "Grand Theft Auto V Enhanced"
--                   -> "gtave" and "gta5e"; "Left 4 Dead" -> "l4d"
-- Words may be typed in any order and skipped ("NBA Playgrounds" matches
-- "NBA 2K Playgrounds 2") because every token is matched independently.
--
-- Computed on the fly (no stored column), which is fine at collection size.
-- These functions depend on the all_items row type: a later migration that
-- drops and recreates the view must recreate them too.

create extension if not exists unaccent;

create or replace function public.search_normalize(p_text text)
returns text
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  romans constant text[] := array[
    'i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi',
    'xvii','xviii','xix','xx','xxi','xxii','xxiii','xxiv','xxv','xxvi','xxvii','xxviii',
    'xxix','xxx','xxxi','xxxii','xxxiii','xxxiv','xxxv','xxxvi','xxxvii','xxxviii','xxxix'
  ];
  base text;
  spaced text;
  joined text;
  words text[];
  alt_words text[] := '{}';
  w text;
  alt text;
  pos int;
  initials text := '';
  alt_initials text := '';
  alt_text text;
begin
  if p_text is null then
    return null;
  end if;

  base := regexp_replace(lower(unaccent(p_text)), '[''’‘`´.]', '', 'g');
  spaced := btrim(regexp_replace(base, '[^a-z0-9]+', ' ', 'g'));
  if spaced = '' then
    return '';
  end if;
  joined := btrim(regexp_replace(replace(base, '-', ''), '[^a-z0-9]+', ' ', 'g'));

  words := string_to_array(spaced, ' ');
  foreach w in array words loop
    pos := array_position(romans, w);
    if pos is not null then
      alt := pos::text;
    elsif w ~ '^[1-9][0-9]?$' then
      -- romans[40..99] is null, so larger numbers keep their own spelling.
      alt := coalesce(romans[w::int], w);
    else
      alt := w;
    end if;
    alt_words := alt_words || alt;
    initials := initials || case when w ~ '^[0-9]+$' then w else left(w, 1) end;
    alt_initials := alt_initials || case when alt ~ '^[0-9]+$' then alt else left(alt, 1) end;
  end loop;
  alt_text := array_to_string(alt_words, ' ');

  return concat_ws(
    ' ',
    spaced,
    nullif(joined, spaced),
    nullif(alt_text, spaced),
    initials,
    nullif(alt_initials, initials)
  );
end;
$$;

create or replace function public.title_search(public.all_items)
returns text
language sql
stable
as $$
  select public.search_normalize($1.title)
$$;

create or replace function public.subtitle_search(public.all_items)
returns text
language sql
stable
as $$
  select public.search_normalize($1.subtitle)
$$;

grant execute on function public.search_normalize(text) to anon, authenticated;
grant execute on function public.title_search(public.all_items) to anon, authenticated;
grant execute on function public.subtitle_search(public.all_items) to anon, authenticated;

-- Let PostgREST pick up the new computed fields without a restart.
notify pgrst, 'reload schema';
