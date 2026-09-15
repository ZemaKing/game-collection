import { useEffect, useMemo, useState } from 'react'
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
import { ItemListingToolbar } from '@/features/items/components/ItemListingToolbar'
import { useFilters } from '@/features/items/useFilters'
import { useItemListing } from '@/features/items/useItemListing'
import { useListingPrefs } from '@/features/items/useListingPrefs'
import type { AllItemRow, Genre, Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

const PAGE_SIZE = 15

function DashboardPage() {
  const { t } = useLocale()
  const { view, setView } = useListingPrefs('dashboard.view')
  const { filters, setFilters, clearAll } = useFilters()
  const { items, totalCount, setPage, loading, error, hasMore } = useItemListing(filters, PAGE_SIZE)

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [years, setYears] = useState<number[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [genreSummary, setGenreSummary] = useState<GenreSummaryRow[]>([])
  const [recentItems, setRecentItems] = useState<AllItemRow[]>([])

  // Sidebar/summary data is independent of the grid's filters, so it loads once.
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
      .catch(() => {
        // Sidebar data is supplementary; the main grid below surfaces load errors.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p.name])), [platforms])
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
      <div>
        <h1 className="text-2xl font-bold text-text">{t('home.welcome')}</h1>
        <p className="mt-1 text-sm text-muted">{t('home.subtitle')}</p>
      </div>

      {platforms.length > 0 && (
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
      )}

      {summary && (
        <div className="lg:hidden">
          <SummaryPanel compact summary={summary} genres={genreSummary} recentItems={recentItems} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {t('listing.itemsCount', { count: String(totalCount) })}
          </p>

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
                ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4'
                : 'flex flex-col gap-2'
            }
          >
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                platformName={item.platform_id ? (platformById.get(item.platform_id) ?? null) : null}
                view={view}
                showTypeBadge={filters.itemTypes.length !== 1}
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

        {summary && (
          <div className="hidden lg:block">
            <SummaryPanel summary={summary} genres={genreSummary} recentItems={recentItems} />
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
