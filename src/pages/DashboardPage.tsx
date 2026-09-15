import { useEffect, useMemo, useState } from 'react'
import { SummaryPanel } from '@/features/dashboard/SummaryPanel'
import {
  fetchDashboardSummary,
  fetchGenreSummary,
  fetchPlatforms,
  fetchRecentlyAdded,
  type DashboardSummary,
  type GenreSummaryRow,
} from '@/features/items/api'
import { ItemCard } from '@/features/items/components/ItemCard'
import { ItemListingToolbar } from '@/features/items/components/ItemListingToolbar'
import { useItemListing } from '@/features/items/useItemListing'
import { useListingPrefs } from '@/features/items/useListingPrefs'
import type { AllItemRow, Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

const PAGE_SIZE = 15

function DashboardPage() {
  const { t } = useLocale()
  const { prefs, setPrefs } = useListingPrefs('dashboard.prefs')
  const { items, totalCount, setPage, loading, error, hasMore } = useItemListing(prefs, PAGE_SIZE)

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [genres, setGenres] = useState<GenreSummaryRow[]>([])
  const [recentItems, setRecentItems] = useState<AllItemRow[]>([])

  // Sidebar/summary data is independent of the grid's filters, so it loads once.
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchPlatforms(),
      fetchDashboardSummary(),
      fetchGenreSummary(),
      fetchRecentlyAdded(5),
    ])
      .then(([platformsData, summaryData, genresData, recentData]) => {
        if (cancelled) return
        setPlatforms(platformsData)
        setSummary(summaryData)
        setGenres(genresData)
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('home.welcome')}</h1>
        <p className="mt-1 text-sm text-muted">{t('home.subtitle')}</p>
      </div>

      {platforms.length > 0 && (
        <ItemListingToolbar platforms={platforms} prefs={prefs} setPrefs={setPrefs} />
      )}

      {summary && (
        <div className="lg:hidden">
          <SummaryPanel compact summary={summary} genres={genres} recentItems={recentItems} />
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
            <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted">
              {t('listing.empty')}
            </p>
          )}

          <div
            className={
              prefs.view === 'grid'
                ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4'
                : 'flex flex-col gap-2'
            }
          >
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                platformName={item.platform_id ? (platformById.get(item.platform_id) ?? null) : null}
                view={prefs.view}
                showTypeBadge={prefs.itemType === 'all'}
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
            <SummaryPanel summary={summary} genres={genres} recentItems={recentItems} />
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
