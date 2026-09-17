import { useEffect, useState } from 'react'
import { fetchItemRelationships, type ItemRelationships } from '@/features/items/relationshipApi'
import type { ItemType } from '@/features/items/types'

const EMPTY: ItemRelationships = { parents: [], children: [] }

/**
 * Supplementary to the main item fetch, so failures here don't block the
 * page — they just leave the Related Items section empty, the same way
 * Dashboard treats its sidebar summary data as best-effort.
 */
export function useItemRelationships(itemType: ItemType, id: string | undefined): ItemRelationships {
  const [relationships, setRelationships] = useState<ItemRelationships>(EMPTY)

  // Clear stale relationships from a previous item during render rather
  // than in an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  const requestKey = `${itemType}|${id ?? ''}`
  const [lastRequestKey, setLastRequestKey] = useState(requestKey)
  if (requestKey !== lastRequestKey) {
    setLastRequestKey(requestKey)
    setRelationships(EMPTY)
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchItemRelationships(itemType, id)
      .then((result) => {
        if (!cancelled) setRelationships(result)
      })
      .catch(() => {
        if (!cancelled) setRelationships(EMPTY)
      })
    return () => {
      cancelled = true
    }
  }, [itemType, id])

  return relationships
}
