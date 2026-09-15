import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPlatforms } from '@/features/items/api'
import { ItemListingPage } from '@/features/items/components/ItemListingPage'
import type { Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

function PlatformPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useLocale()
  const [platforms, setPlatforms] = useState<Platform[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPlatforms()
      .then((data) => {
        if (!cancelled) setPlatforms(data)
      })
      .catch(() => {
        if (!cancelled) setPlatforms([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (platforms === null) return null

  const platform = platforms.find((p) => p.slug === slug)
  if (!platform) {
    return (
      <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted">
        {t('platform.notFound')}
      </p>
    )
  }

  return <ItemListingPage platform={platform} />
}

export default PlatformPage
