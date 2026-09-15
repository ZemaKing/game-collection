import { useEffect, useMemo, useState } from 'react'
import { DashboardToolbar } from '@/features/dashboard/DashboardToolbar'
import { SummaryPanel } from '@/features/dashboard/SummaryPanel'
import { useDashboardPrefs } from '@/features/dashboard/useDashboardPrefs'
import {
  fetchDashboardSummary,
  fetchGenreSummary,
  fetchItems,
  fetchPlatforms,
  fetchRecentlyAdded,
  type DashboardSummary,
  type GenreSummaryRow,
} from '@/features/items/api'
import { ItemCard } from '@/features/items/components/ItemCard'
import type { AllItemRow, Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

const PAGE_SIZE = 15

function DashboardPage() {
  const { t } = useLocale()
  const { prefs, setPrefs } = useDashboardPrefs()

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [genres, setGenres] = useState<GenreSummaryRow[]>([])
  const [recentItems, setRecentItems] = useState<AllItemRow[]>([])

  const [items, setItems] = useState<AllItemRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)

  const filterKey = `${prefs.status}|${prefs.itemType}|${prefs.platformId}|${prefs.sort}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    // Filters/sort changed: reset pagination during render rather than in an
    // effect (see https://react.dev/learn/you-might-not-need-an-effect).
    setLastFilterKey(filterKey)
    setPage(0)
  }

  const paramsKey = `${filterKey}|${page}`
  const [fetchState, setFetchState] = useState<
    { key: string; status: 'loaded' | 'error'; message?: string } | null
  >(null)

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

  useEffect(() => {
    let cancelled = false
    fetchItems({
      status: prefs.status,
      itemType: prefs.itemType,
      platformId: prefs.platformId,
      sort: prefs.sort,
      page,
      pageSize: PAGE_SIZE,
    })
      .then(({ rows, count }) => {
        if (cancelled) return
        setItems((prev) => (page === 0 ? rows : [...prev, ...rows]))
        setTotalCount(count)
        setFetchState({ key: paramsKey, status: 'loaded' })
      })
      .catch((error: Error) => {
        if (cancelled) return
        setFetchState({ key: paramsKey, status: 'error', message: error.message })
      })
    return () => {
      cancelled = true
    }
    // paramsKey encodes every dependency below; re-run whenever it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  const itemsLoading = fetchState?.key !== paramsKey
  const itemsError =
    fetchState?.key === paramsKey && fetchState.status === 'error'
      ? (fetchState.message ?? null)
      : null

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p.name])), [platforms])

  const hasMore = items.length < totalCount

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('home.welcome')}</h1>
        <p className="mt-1 text-sm text-muted">{t('home.subtitle')}</p>
      </div>

      {platforms.length > 0 && (
        <DashboardToolbar platforms={platforms} prefs={prefs} setPrefs={setPrefs} />
      )}

      {summary && (
        <div className="lg:hidden">
          <SummaryPanel
            compact
            summary={summary}
            genres={genres}
            recentItems={recentItems}
            prefs={prefs}
            setPrefs={setPrefs}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {t('dashboard.itemsFound', { count: String(totalCount) })}
          </p>

          {itemsError && (
            <p className="rounded-lg border border-wishlist bg-wishlist-bg px-4 py-3 text-sm text-wishlist">
              {t('dashboard.error', { message: itemsError })}
            </p>
          )}

          {!itemsError && items.length === 0 && !itemsLoading && (
            <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted">
              {t('dashboard.empty')}
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
              />
            ))}
          </div>

          {itemsLoading && (
            <p className="text-center text-sm text-muted">{t('dashboard.loading')}</p>
          )}

          {hasMore && !itemsLoading && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="self-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-card-hover"
            >
              {t('dashboard.loadMore')}
            </button>
          )}
        </div>

        {summary && (
          <div className="hidden lg:block">
            <SummaryPanel
              summary={summary}
              genres={genres}
              recentItems={recentItems}
              prefs={prefs}
              setPrefs={setPrefs}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
