import { useEffect, useMemo, useState } from 'react'
import { ITEM_TYPE_META } from '@/features/items/constants'
import { fetchPlatforms } from '@/features/items/api'
import { useItemListing } from '@/features/items/useItemListing'
import { useListingPrefs } from '@/features/items/useListingPrefs'
import { ItemCard } from '@/features/items/components/ItemCard'
import { ItemListingToolbar } from '@/features/items/components/ItemListingToolbar'
import type { ItemType, Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

const PAGE_SIZE = 20

interface ItemListingPageProps {
  /** Locks the listing to one item type (Games, Artbooks, ...). Omit for All Items. */
  itemType?: ItemType
}

export function ItemListingPage({ itemType }: ItemListingPageProps) {
  const { t } = useLocale()
  const storageKey = `listing.${itemType ?? 'all'}`
  const { prefs, setPrefs } = useListingPrefs(storageKey, itemType)
  const { items, totalCount, setPage, loading, error, hasMore } = useItemListing(
    prefs,
    PAGE_SIZE,
    itemType,
  )

  const [platforms, setPlatforms] = useState<Platform[]>([])
  useEffect(() => {
    let cancelled = false
    fetchPlatforms()
      .then((data) => {
        if (!cancelled) setPlatforms(data)
      })
      .catch(() => {
        // Platform names are cosmetic (badges); the grid below surfaces load errors.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p.name])), [platforms])

  const meta = itemType ? ITEM_TYPE_META[itemType] : null
  const TitleIcon = meta?.icon
  const titleKey = meta?.labelKey ?? 'nav.allItems'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
          {TitleIcon && <TitleIcon size={22} className="text-muted" />}
          {t(titleKey)}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('listing.itemsCount', { count: String(totalCount) })}</p>
      </div>

      <ItemListingToolbar
        platforms={platforms}
        prefs={prefs}
        setPrefs={setPrefs}
        showTypeFilter={!itemType}
      />

      {error && (
        <p className="rounded-lg border border-wishlist bg-wishlist-bg px-4 py-3 text-sm text-wishlist">
          {t('listing.error', { message: error })}
        </p>
      )}

      {!error && items.length === 0 && !loading && (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted">
          {t('listing.empty')}
        </p>
      )}

      <div
        className={
          prefs.view === 'grid'
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
            : 'flex flex-col gap-2'
        }
      >
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            platformName={item.platform_id ? (platformById.get(item.platform_id) ?? null) : null}
            view={prefs.view}
            showTypeBadge={!itemType}
          />
        ))}
      </div>

      {loading && <p className="text-center text-sm text-muted">{t('listing.loading')}</p>}

      {hasMore && !loading && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="self-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-card-hover"
        >
          {t('listing.loadMore')}
        </button>
      )}
    </div>
  )
}
