import { useEffect, useState } from 'react'
import { fetchItemRelationships, type ItemRelationships } from '@/features/items/relationshipApi'
import type { ItemType } from '@/features/items/types'

const EMPTY: ItemRelationships = { parents: [], children: [] }

type FetchResult = { key: string; token: number; data: ItemRelationships | null }

export interface ItemRelationshipsResult extends ItemRelationships {
  /**
   * `parents`/`children` are empty until `ready`, and stay empty on `error`.
   * Read-only views can treat that as "no relationships" (best-effort); the
   * Edit form must not, since saving with a false empty list deletes links.
   */
  status: 'loading' | 'ready' | 'error'
  reload: () => void
}

/**
 * Supplementary to the main item fetch, so failures here don't block the
 * detail page — they just leave the Related Items section empty, the same way
 * Dashboard treats its sidebar summary data as best-effort.
 */
export function useItemRelationships(itemType: ItemType, id: string | undefined): ItemRelationshipsResult {
  const requestKey = `${itemType}|${id ?? ''}`
  const [token, setToken] = useState(0)
  const [result, setResult] = useState<FetchResult | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchItemRelationships(itemType, id)
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, token, data })
      })
      .catch(() => {
        if (!cancelled) setResult({ key: requestKey, token, data: null })
      })
    return () => {
      cancelled = true
    }
  }, [itemType, id, requestKey, token])

  // "Loading" is derived (no result for the current item and token yet) rather
  // than set inside the effect, which also drops a previous item's relationships.
  const settled = result?.key === requestKey && result.token === token ? result : null
  const status = !id ? 'ready' : settled === null ? 'loading' : settled.data ? 'ready' : 'error'

  return { ...(settled?.data ?? EMPTY), status, reload: () => setToken((n) => n + 1) }
}
