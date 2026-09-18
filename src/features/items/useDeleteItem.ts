import { useState } from 'react'
import { deleteItem } from '@/features/items/deleteApi'
import type { ItemType } from '@/features/items/types'

export function useDeleteItem(itemType: ItemType) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(itemId: string): Promise<boolean> {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteItem(itemType, itemId)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setIsDeleting(false)
    }
  }

  return { remove, isDeleting, error }
}
