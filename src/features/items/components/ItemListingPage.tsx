import { Gamepad2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  fetchAvailableEditions,
  fetchAvailableYears,
  fetchGenres,
  fetchPlatforms,
  fetchTags,
  type Tag,
} from '@/features/items/api'
import { PlusIcon } from '@/components/icons/ActionIcons'
import { Button } from '@/components/ui/Button'
import { ITEM_TYPE_META, PLATFORM_ICONS } from '@/features/items/constants'
import { hasEditionField } from '@/features/items/editions'
import { useFilters } from '@/features/items/useFilters'
import { useItemListing } from '@/features/items/useItemListing'
import { useListingPrefs } from '@/features/items/useListingPrefs'
import { ItemCard } from '@/features/items/components/ItemCard'
import { ItemCardSkeleton } from '@/features/items/components/ItemCardSkeleton'
import { ItemListingToolbar } from '@/features/items/components/ItemListingToolbar'
import type { Genre, ItemType, Platform } from '@/features/items/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAuth } from '@/hooks/useAuth'
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
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const storageKey = platform ? `listing.platform.${platform.slug}` : `listing.${itemType ?? 'all'}`
  const { view, setView } = useListingPrefs(storageKey)
  const { filters, setFilters, clearAll } = useFilters()

  const deletedTitle = (location.state as { deletedTitle?: string } | null)?.deletedTitle ?? null
  const [deletedBannerTitle, setDeletedBannerTitle] = useState<string | null>(deletedTitle)

  useEffect(() => {
    if (!deletedTitle) return
    // Clear the navigation state so refresh/back doesn't re-show the banner.
    navigate(location.pathname + location.search, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { items, totalCount, page, setPage, loading, error, hasMore, reload } = useItemListing(
    filters,
    PAGE_SIZE,
    itemType,
    platform?.id,
  )

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [years, setYears] = useState<number[]>([])
  const [editions, setEditions] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchPlatforms(),
      fetchGenres(),
      fetchTags(),
      fetchAvailableYears(),
      fetchAvailableEditions(itemType),
    ])
      .then(([platformsData, genresData, tagsData, yearsData, editionsData]) => {
        if (cancelled) return
        setPlatforms(platformsData)
        setGenres(genresData)
        setTags(tagsData)
        setYears(yearsData)
        setEditions(editionsData)
      })
      .catch(() => {
        // Filter option lists are supplementary; the grid below surfaces load errors.
      })
    return () => {
      cancelled = true
    }
  }, [itemType])

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p])), [platforms])

  const meta = itemType ? ITEM_TYPE_META[itemType] : null
  const TitleIcon = platform ? (PLATFORM_ICONS[platform.slug] ?? Gamepad2) : meta?.icon
  const titleText = platform ? platform.name : t(meta?.labelKey ?? 'nav.allItems')
  const showTypeBadge = !itemType
  const showGenreFilter = !itemType || itemType === 'game'
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.itemTypes.length > 0 ||
    filters.platformIds.length > 0 ||
    filters.genreIds.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.editions.length > 0 ||
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
        <p aria-live="polite" className="mt-1 text-sm text-muted">
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
        editions={editions}
        showTypeFilter={!itemType}
        showPlatformFilter={!platform}
        showGenreFilter={showGenreFilter}
        showEditionFilter={!itemType || hasEditionField(itemType)}
      />

      {deletedBannerTitle && (
        <p role="status" className="flex items-center justify-between gap-3 rounded-lg border border-success bg-success-bg px-4 py-3 text-sm text-success">
          {t('detail.deleteSuccess', { title: deletedBannerTitle })}
          <button
            type="button"
            onClick={() => setDeletedBannerTitle(null)}
            className="shrink-0 font-semibold hover:underline"
          >
            {t('images.dismiss')}
          </button>
        </p>
      )}

      {error && <ErrorState message={t('listing.error', { message: error })} onRetry={reload} />}

      {!error && items.length === 0 && !loading && (
        <EmptyState
          icon={meta?.icon}
          body={hasActiveFilters ? t('listing.empty') : t('listing.emptyCollection')}
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="font-semibold text-accent hover:text-accent-hover"
              >
                {t('listing.clearFilters')}
              </button>
            ) : (
              user && (
                <Link
                  to={itemType ? `/items/new?type=${itemType}` : '/items/new'}
                  className="font-semibold text-accent hover:text-accent-hover"
                >
                  {t('listing.emptyCollectionCta')}
                </Link>
              )
            )
          }
        />
      )}

      {!error && (items.length > 0 || (loading && page === 0)) && (
        <div
          className={
            view === 'grid'
              ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'
              : 'flex flex-col gap-2'
          }
        >
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              platformName={item.platform_id ? (platformById.get(item.platform_id)?.name ?? null) : null}
              platformSlug={item.platform_id ? (platformById.get(item.platform_id)?.slug ?? null) : null}
              view={view}
              showTypeBadge={showTypeBadge}
            />
          ))}
          {loading &&
            Array.from({ length: page === 0 ? PAGE_SIZE : 4 }, (_, i) => (
              <ItemCardSkeleton key={`skeleton-${i}`} view={view} />
            ))}
        </div>
      )}

      {/* Stays mounted while the next page loads, so a keyboard user's focus isn't dropped. */}
      {hasMore && (
        <Button
          icon={PlusIcon}
          className="self-center aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-disabled={loading || undefined}
          onClick={() => {
            if (!loading) setPage((p) => p + 1)
          }}
        >
          {t('listing.loadMore')}
        </Button>
      )}
    </div>
  )
}
