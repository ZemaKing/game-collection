export type ErrorKind = 'network' | 'auth' | 'unknown'

/**
 * Classifies a thrown Supabase/Postgrest/fetch error so callers can show a
 * specific "you're offline" / "session expired" message instead of a raw
 * Postgres/JWT string. Mirrors the `AutofillError`/`kind` pattern already
 * used for the RAWG endpoints in `gameAutofillApi.ts`.
 */
export function classifySupabaseError(error: unknown, isOnline: boolean): ErrorKind {
  if (!isOnline) return 'network'

  const message = error instanceof Error ? error.message : String(error)
  const code = (error as { code?: string } | null)?.code

  if (/failed to fetch|networkerror|load failed/i.test(message)) return 'network'
  if (code === 'PGRST301' || /jwt|token/i.test(message)) return 'auth'
  if (code === '42501' || /row-level security/i.test(message)) return 'auth'

  return 'unknown'
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
