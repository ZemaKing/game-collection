import { useEffect, useState } from 'react'
import { AutofillError, searchGames, type GameSearchResult } from '@/features/items/gameAutofillApi'

const DEBOUNCE_MS = 400

const EMPTY_RESULTS: GameSearchResult[] = []

/**
 * Debounced RAWG search with stale-response protection — same shape as
 * `src/features/search/useSearch.ts`, reused here rather than reinvented.
 */
export function useGameAutofillSearch(query: string) {
  const trimmed = query.trim()

  const [resultState, setResultState] = useState<{ key: string; results: GameSearchResult[] } | null>(
    null,
  )
  const [errorState, setErrorState] = useState<{ key: string; error: AutofillError } | null>(null)

  useEffect(() => {
    if (!trimmed) return
    let cancelled = false
    const handle = window.setTimeout(() => {
      searchGames(trimmed)
        .then((results) => {
          if (cancelled) return
          setResultState({ key: trimmed, results })
        })
        .catch((err: unknown) => {
          if (cancelled) return
          const error = err instanceof AutofillError ? err : new AutofillError('network', 'Unexpected error.')
          setErrorState({ key: trimmed, error })
        })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [trimmed])

  const results = resultState?.key === trimmed ? resultState.results : EMPTY_RESULTS
  const error = errorState?.key === trimmed ? errorState.error : null
  const loading = trimmed !== '' && resultState?.key !== trimmed && error === null

  return { results, loading, error }
}
