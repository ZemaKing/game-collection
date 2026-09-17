import { Clock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchItems, fetchPlatforms } from '@/features/items/api'
import { ItemCard } from '@/features/items/components/ItemCard'
import type { AllItemRow, Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'
import type { Locale, TranslationKey } from '@/lib/i18n'

const PAGE_SIZE = 20

interface DateGroup {
  key: string
  label: string
  items: AllItemRow[]
}

/**
 * There's no separate activity/audit log (Phase 9 scope): with no CRUD
 * implemented yet (Phases 16-18), `created_at` is the only timestamp that
 * can differ between items, so "recently added" is derived directly from
 * it. Once edits are possible, `updated_at`-based activity can be layered
 * in here.
 */
function groupByDay(items: AllItemRow[], t: (key: TranslationKey) => string, locale: Locale) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // 'sr' alone defaults to Cyrillic in Intl; the rest of the app's Serbian
  // text is Latin script, so it's pinned to 'sr-Latn-RS' (see format.ts).
  const dateFormatter = new Intl.DateTimeFormat(locale === 'sr' ? 'sr-Latn-RS' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const groups: DateGroup[] = []
  const groupsByKey = new Map<string, DateGroup>()

  for (const item of items) {
    const created = new Date(item.created_at)
    const startOfDay = new Date(created.getFullYear(), created.getMonth(), created.getDate())
    const diffDays = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000)
    const key = startOfDay.toISOString()

    let group = groupsByKey.get(key)
    if (!group) {
      const label =
        diffDays === 0
          ? t('recentlyAdded.today')
          : diffDays === 1
            ? t('recentlyAdded.yesterday')
            : dateFormatter.format(startOfDay)
      group = { key, label, items: [] }
      groupsByKey.set(key, group)
      groups.push(group)
    }
    group.items.push(item)
  }

  return groups
}

function RecentlyAddedPage() {
  const { t, locale } = useLocale()
  const [items, setItems] = useState<AllItemRow[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [fetchState, setFetchState] = useState<
    { page: number; status: 'loaded' | 'error'; message?: string } | null
  >(null)

  useEffect(() => {
    let cancelled = false
    fetchPlatforms()
      .then((data) => {
        if (!cancelled) setPlatforms(data)
      })
      .catch(() => {
        // Platform names are cosmetic (badges); the list below surfaces load errors.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchItems({
      itemTypes: [],
      platformIds: [],
      genreIds: [],
      tagIds: [],
      years: [],
      conditions: [],
      collectionDateFrom: null,
      collectionDateTo: null,
      sort: 'recently_added',
      page,
      pageSize: PAGE_SIZE,
    })
      .then(({ rows, count }) => {
        if (cancelled) return
        setItems((prev) => (page === 0 ? rows : [...prev, ...rows]))
        setTotalCount(count)
        setFetchState({ page, status: 'loaded' })
      })
      .catch((err: Error) => {
        if (!cancelled) setFetchState({ page, status: 'error', message: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [page])

  const loading = fetchState?.page !== page
  const error = fetchState?.page === page && fetchState.status === 'error' ? (fetchState.message ?? null) : null

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p.name])), [platforms])
  const groups = useMemo(() => groupByDay(items, t, locale), [items, t, locale])
  const hasMore = items.length < totalCount

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
          <Clock size={22} className="text-muted" />
          {t('nav.recentlyAdded')}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t('listing.itemsCount', { count: String(totalCount) })}
        </p>
      </div>

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

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className="mb-2 text-sm font-semibold text-muted">{group.label}</h2>
            <div className="flex flex-col gap-2">
              {group.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  platformName={
                    item.platform_id ? (platformById.get(item.platform_id) ?? null) : null
                  }
                  view="list"
                  showTypeBadge
                />
              ))}
            </div>
          </section>
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

export default RecentlyAddedPage
