/**
 * Letters `unaccent` folds that Unicode decomposition (NFD) leaves alone, so
 * the query folds the same way as the stored text.
 */
const SPECIAL_FOLDS: Record<string, string> = {
  ß: 'ss',
  đ: 'd',
  ł: 'l',
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  þ: 'th',
}

/**
 * Splits a search query into the lowercase alphanumeric tokens matched against
 * the `title_search` / `subtitle_search` computed fields (migration
 * `20260927120000_fuzzy_search.sql`), mirroring its `search_normalize`:
 * accents are stripped, apostrophes and dots are dropped ("F.I.S.T." ->
 * "fist", "Meier’s" -> "meiers"), and every other non-alphanumeric character
 * separates words ("Half-Life" -> "half", "life"). Each token is matched as a
 * substring on its own, so words can be skipped or reordered. Numerals,
 * hyphen-joined spellings and acronyms are handled on the stored side.
 *
 * Tokens only ever contain `[a-z0-9]`, so they're safe inside a LIKE pattern
 * without escaping. Duplicates are dropped.
 */
export function searchTokens(query: string): string[] {
  const folded = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[ßđłøæœþ]/g, (char) => SPECIAL_FOLDS[char])
    .replace(/['’‘`´.]/g, '')
  return Array.from(new Set(folded.split(/[^a-z0-9]+/).filter(Boolean)))
}

/** `ilike` pattern for one token (see `searchTokens`). */
export function tokenPattern(token: string): string {
  return `%${token}%`
}
