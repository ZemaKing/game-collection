import { useEffect, useState } from 'react'
import { fetchDlcsForGame, fetchItemRow } from '@/features/items/dlcApi'
import type { AllItemRow } from '@/features/items/types'

type Fetched<T> = { key: string; token: number; data: T | null }

export interface LinkedItems<T> {
  status: 'loading' | 'ready' | 'error'
  data: T
  reload: () => void
}

/**
 * Best-effort supplementary fetch (like `useItemRelationships`): a failure
 * leaves the section empty instead of blocking the whole page. `key` identifies
 * the request; a `null` key means "nothing to fetch".
 */
function useLinked<T>(key: string | null, empty: T, fetcher: () => Promise<T>): LinkedItems<T> {
  const [token, setToken] = useState(0)
  const [result, setResult] = useState<Fetched<T> | null>(null)

  useEffect(() => {
    if (!key) return
    let cancelled = false
    fetcher()
      .then((data) => {
        if (!cancelled) setResult({ key, token, data })
      })
      .catch(() => {
        if (!cancelled) setResult({ key, token, data: null })
      })
    return () => {
      cancelled = true
    }
    // `fetcher` is a fresh closure every render; `key` + `token` identify the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, token])

  const settled = result?.key === key && result.token === token ? result : null
  const status = !key ? 'ready' : settled === null ? 'loading' : settled.data ? 'ready' : 'error'
  return { status, data: settled?.data ?? empty, reload: () => setToken((n) => n + 1) }
}

const NO_ROWS: AllItemRow[] = []

/** The DLCs / expansions of a game. */
export function useGameDlcs(gameId: string | undefined): LinkedItems<AllItemRow[]> {
  return useLinked(gameId ? `dlcs|${gameId}` : null, NO_ROWS, () => fetchDlcsForGame(gameId as string))
}

/** The base game of a DLC, as a listing row (null while loading or if it can't be found). */
export function useBaseGame(gameId: string | null | undefined): LinkedItems<AllItemRow | null> {
  return useLinked(gameId ? `base|${gameId}` : null, null, () => fetchItemRow(gameId as string))
}
