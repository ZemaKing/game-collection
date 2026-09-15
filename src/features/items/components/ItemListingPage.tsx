import { Gamepad2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAvailableYears,
  fetchGenres,
  fetchPlatforms,
  fetchTags,
  type Tag,
} from '@/features/items/api'
import { ITEM_TYPE_META, PLATFORM_ICONS } from '@/features/items/constants'
import { useFilters } from '@/features/items/useFilters'
import { useItemListing } from '@/features/items/useItemListing'
import { useListingPrefs } from '@/features/items/useListingPrefs'
import { ItemCard } from '@/features/items/components/ItemCard'
import { ItemListingToolbar } from '@/features/items/components/ItemListingToolbar'
import type { Genre, ItemType, Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

const PAGE_SIZE = 20

interface ItemListingPageProps {
  /** Locks the listing to one item type (Games, Artbooks, ...). Omit for All Items / platform pages. */
  itemType?: ItemType
  /** Locks the listing to one platform (mixed item types). Omit for All Items / type pages. */
  platform?: Platform
}

export function ItemListingPage({ itemType, platform }: ItemListingPageProps) {
  const { t } = useLocale()
  const storageKey = platform ? `listing.platform.${platform.slug}` : `listing.${itemType ?? 'all'}`
  const { view, setView } = useListingPrefs(storageKey)
  const { filters, setFilters, clearAll } = useFilters()

  const { items, totalCount, setPage, loading, error, hasMore } = useItemListing(
    filters,
    PAGE_SIZE,
    itemType,
    platform?.id,
  )

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [years, setYears] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchPlatforms(), fetchGenres(), fetchTags(), fetchAvailableYears()])
      .then(([platformsData, genresData, tagsData, yearsData]) => {
        if (cancelled) return
        setPlatforms(platformsData)
        setGenres(genresData)
        setTags(tagsData)
        setYears(yearsData)
      })
      .catch(() => {
        // Filter option lists are supplementary; the grid below surfaces load errors.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p.name])), [platforms])

  const meta = itemType ? ITEM_TYPE_META[itemType] : null
  const TitleIcon = platform ? (PLATFORM_ICONS[platform.slug] ?? Gamepad2) : meta?.icon
  const titleText = platform ? platform.name : t(meta?.labelKey ?? 'nav.allItems')
  const showTypeBadge = !itemType
  const showGenreFilter = !itemType || itemType === 'game'
  const hasActiveFilters =
    filters.itemTypes.length > 0 ||
    filters.platformIds.length > 0 ||
    filters.genreIds.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.years.length > 0 ||
    filters.conditions.length > 0 ||
    filters.collectionDateFrom !== null ||
    filters.collectionDateTo !== null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
          {TitleIcon && <TitleIcon size={22} className="text-muted" />}
          {titleText}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t('listing.itemsCount', { count: String(totalCount) })}
        </p>
      </div>

      <ItemListingToolbar
        filters={filters}
        setFilters={setFilters}
        clearAll={clearAll}
        view={view}
        setView={setView}
        platforms={platforms}
        genres={genres}
        tags={tags}
        years={years}
        showTypeFilter={!itemType}
        showPlatformFilter={!platform}
        showGenreFilter={showGenreFilter}
      />

      {error && (
        <p className="rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
          {t('listing.error', { message: error })}
        </p>
      )}

      {!error && items.length === 0 && !loading && (
        <p className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted">
          {t('listing.empty')}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="font-medium text-accent hover:text-accent-hover"
            >
              {t('listing.clearFilters')}
            </button>
          )}
        </p>
      )}

      <div
        className={
          view === 'grid'
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
            : 'flex flex-col gap-2'
        }
      >
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            platformName={item.platform_id ? (platformById.get(item.platform_id) ?? null) : null}
            view={view}
            showTypeBadge={showTypeBadge}
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
