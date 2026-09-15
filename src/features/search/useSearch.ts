import { useEffect, useState } from 'react'
import { searchItems } from '@/features/search/api'
import type { AllItemRow } from '@/features/items/types'

const DEBOUNCE_MS = 300

// Stable reference: an inline `[]` would be a new array every render, which
// breaks reference-equality checks (e.g. resetting keyboard-nav selection
// when results change) in consumers.
const EMPTY_RESULTS: AllItemRow[] = []

/**
 * Debounced search with stale-response protection: only the result set
 * whose key matches the current (trimmed) query is ever surfaced, so a
 * slow earlier response can't overwrite a faster later one.
 */
export function useSearch(query: string) {
  const trimmed = query.trim()

  const [resultState, setResultState] = useState<{ key: string; results: AllItemRow[] } | null>(
    null,
  )
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null)

  useEffect(() => {
    if (!trimmed) return
    let cancelled = false
    const handle = window.setTimeout(() => {
      searchItems(trimmed)
        .then((results) => {
          if (cancelled) return
          setResultState({ key: trimmed, results })
        })
        .catch((error: Error) => {
          if (cancelled) return
          setErrorState({ key: trimmed, message: error.message })
        })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [trimmed])

  const results = resultState?.key === trimmed ? resultState.results : EMPTY_RESULTS
  const error = errorState?.key === trimmed ? errorState.message : null
  const loading = trimmed !== '' && resultState?.key !== trimmed && error === null

  return { results, loading, error }
}
