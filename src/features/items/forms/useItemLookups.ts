import { useEffect, useState } from 'react'
import { fetchGenres, fetchPlatforms, fetchTags, type Tag } from '@/features/items/api'
import type { Genre, Platform } from '@/features/items/types'

export interface ItemLookups {
  platforms: Platform[]
  genres: Genre[]
  tags: Tag[]
  loading: boolean
}

/** Options for the form's platform/genre/tag pickers, fetched once per form mount. */
export function useItemLookups(): ItemLookups {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchPlatforms(), fetchGenres(), fetchTags()])
      .then(([platformRows, genreRows, tagRows]) => {
        if (cancelled) return
        setPlatforms(platformRows)
        setGenres(genreRows)
        setTags(tagRows)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { platforms, genres, tags, loading }
}
