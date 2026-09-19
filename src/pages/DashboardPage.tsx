import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRightIcon } from '@/components/icons/ActionIcons'
import { ButtonIcon } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SummaryPanel } from '@/features/dashboard/SummaryPanel'
import {
  fetchAvailableYears,
  fetchDashboardSummary,
  fetchGenreSummary,
  fetchGenres,
  fetchPlatforms,
  fetchRecentlyAdded,
  fetchTags,
  type DashboardSummary,
  type GenreSummaryRow,
  type Tag,
} from '@/features/items/api'
import { ItemCard } from '@/features/items/components/ItemCard'
import { ItemCardSkeleton } from '@/features/items/components/ItemCardSkeleton'
import { ItemListingToolbar } from '@/features/items/components/ItemListingToolbar'
import { useFilters } from '@/features/items/useFilters'
import { useItemListing } from '@/features/items/useItemListing'
import { useListingPrefs } from '@/features/items/useListingPrefs'
import type { AllItemRow, Genre, Platform } from '@/features/items/types'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

const PAGE_SIZE = 12

function SidebarSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-lg" />
    </div>
  )
}

function DashboardPage() {
  const { t } = useLocale()
  const { user } = useAuth()
  const { view, setView } = useListingPrefs('dashboard.view')
  const { filters, setFilters, clearAll } = useFilters()
  const [searchParams] = useSearchParams()
  const { items, loading, error, hasMore, reload } = useItemListing(filters, PAGE_SIZE)

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [years, setYears] = useState<number[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [genreSummary, setGenreSummary] = useState<GenreSummaryRow[]>([])
  const [recentItems, setRecentItems] = useState<AllItemRow[]>([])
  const [sidebarLoading, setSidebarLoading] = useState(true)
  const [sidebarError, setSidebarError] = useState<string | null>(null)
  const [sidebarRetryToken, setSidebarRetryToken] = useState(0)

  // Reset to "loading" during render when the user retries, rather than in
  // the effect body (see useItemDetail.ts for the same pattern).
  const [lastSidebarRetryToken, setLastSidebarRetryToken] = useState(sidebarRetryToken)
  if (sidebarRetryToken !== lastSidebarRetryToken) {
    setLastSidebarRetryToken(sidebarRetryToken)
    setSidebarLoading(true)
    setSidebarError(null)
  }

  // Sidebar/summary data is independent of the grid's filters, so it loads once
  // (plus whenever the user retries after a failure).
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchPlatforms(),
      fetchGenres(),
      fetchTags(),
      fetchAvailableYears(),
      fetchDashboardSummary(),
      fetchGenreSummary(),
      fetchRecentlyAdded(5),
    ])
      .then(([platformsData, genresData, tagsData, yearsData, summaryData, genreSummaryData, recentData]) => {
        if (cancelled) return
        setPlatforms(platformsData)
        setGenres(genresData)
        setTags(tagsData)
        setYears(yearsData)
        setSummary(summaryData)
        setGenreSummary(genreSummaryData)
        setRecentItems(recentData)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setSidebarError(err.message)
      })
      .finally(() => {
        if (!cancelled) setSidebarLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sidebarRetryToken])

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p])), [platforms])
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
    <div className="flex flex-col gap-6">
      <div
        className="relative flex h-[110px] items-end overflow-hidden rounded-2xl bg-cover bg-right shadow-lg sm:h-[130px] lg:h-[160px] lg:bg-[position:right_25%]"
        style={{ backgroundImage: "url('/dashboard_cover.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-1 p-4 sm:p-5 lg:p-6">
          <h1 className="text-xl font-bold text-text drop-shadow-sm sm:text-2xl lg:text-3xl">
            {t('home.welcome')}
          </h1>
          <p className="text-xs text-muted drop-shadow-sm sm:text-sm">{t('home.subtitle')}</p>
        </div>
      </div>

      {sidebarLoading && <SidebarSkeleton />}

      {sidebarError && !sidebarLoading && (
        <ErrorState
          message={t('listing.error', { message: sidebarError })}
          onRetry={() => setSidebarRetryToken((n) => n + 1)}
        />
      )}

      {summary && !sidebarLoading && (
        <SummaryPanel compact summary={summary} genres={genreSummary} recentItems={recentItems} />
      )}

      {platforms.length > 0 && (
        <div className="lg:hidden">
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
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {error && <ErrorState message={t('listing.error', { message: error })} onRetry={reload} />}

          {!error && items.length === 0 && !loading && (
            <EmptyState
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
                      to="/items/new"
                      className="font-semibold text-accent hover:text-accent-hover"
                    >
                      {t('listing.emptyCollectionCta')}
                    </Link>
                  )
                )
              }
            />
          )}

          {!error && (items.length > 0 || loading) && (
            <div
              className={
                view === 'grid'
                  ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 2xl:grid-cols-6'
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
                  showTypeBadge={filters.itemTypes.length !== 1}
                />
              ))}
              {loading &&
                Array.from({ length: PAGE_SIZE }, (_, i) => (
                  <ItemCardSkeleton key={`skeleton-${i}`} view={view} />
                ))}
            </div>
          )}

          {hasMore && !loading && (
            <Link
              to={{ pathname: '/items', search: searchParams.toString() }}
              className={buttonClasses({ className: 'self-center' })}
            >
              <ButtonIcon icon={ArrowRightIcon} />
              {t('dashboard.viewAll')}
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {platforms.length > 0 && (
            <div className="hidden lg:block">
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
              />
            </div>
          )}
          {summary && !sidebarLoading && !sidebarError && (
            <SummaryPanel summary={summary} genres={genreSummary} recentItems={recentItems} />
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
