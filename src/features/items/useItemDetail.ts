import { useEffect, useState } from 'react'
import { fetchItemDetail, fetchItemDetailTags, fetchItemImages } from '@/features/items/detailApi'
import type { Tag } from '@/features/items/api'
import type { ItemType } from '@/features/items/types'
import type { ItemDetail, ItemImageRow } from '@/features/items/detailTypes'

export type ItemDetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; detail: ItemDetail; images: ItemImageRow[]; tags: Tag[] }

/**
 * A malformed `:id` (not a valid UUID) makes Postgres reject the query
 * rather than return zero rows, so it's treated the same as "row not
 * found" here — both are just an invalid/missing item from the user's
 * perspective (satisfies "invalid-route behavior").
 */
function isInvalidUuidError(message: string): boolean {
  return /invalid input syntax for type uuid/i.test(message)
}

export function useItemDetail(itemType: ItemType, id: string | undefined) {
  const [state, setState] = useState<ItemDetailState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  // Reset to "loading" whenever the target item changes (e.g. navigating
  // from one detail page straight to another), during render rather than in
  // an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  const requestKey = `${itemType}|${id ?? ''}|${retryToken}`
  const [lastRequestKey, setLastRequestKey] = useState(requestKey)
  if (requestKey !== lastRequestKey) {
    setLastRequestKey(requestKey)
    setState({ status: 'loading' })
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([
      fetchItemDetail(itemType, id),
      fetchItemImages(itemType, id),
      fetchItemDetailTags(itemType, id),
    ])
      .then(([detail, images, tags]) => {
        if (cancelled) return
        if (!detail) {
          setState({ status: 'not-found' })
        } else {
          setState({ status: 'loaded', detail, images, tags })
        }
      })
      .catch((error: Error) => {
        if (cancelled) return
        setState(
          isInvalidUuidError(error.message)
            ? { status: 'not-found' }
            : { status: 'error', message: error.message },
        )
      })
    return () => {
      cancelled = true
    }
  }, [itemType, id, retryToken])

  const reload = () => setRetryToken((n) => n + 1)

  if (!id) return { ...({ status: 'not-found' } as ItemDetailState), reload }
  return { ...state, reload }
}
