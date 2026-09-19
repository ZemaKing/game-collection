/**
 * Escapes the characters `LIKE`/`ILIKE` treat as pattern syntax (`%`, `_` and
 * the escape character `\` itself), so user text matches literally. Backslash
 * is escaped first so the backslashes added for `%` and `_` aren't doubled.
 */
export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`)
}
