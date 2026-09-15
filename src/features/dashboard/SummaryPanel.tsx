import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ITEM_TYPES, ITEM_TYPE_META } from '@/features/items/constants'
import { formatCurrency, formatRelativeTime } from '@/features/items/format'
import type { DashboardSummary, GenreSummaryRow } from '@/features/items/api'
import type { AllItemRow } from '@/features/items/types'
import type { ListingPrefs } from '@/features/items/useListingPrefs'
import { useLocale } from '@/hooks/useLocale'

interface SummaryPanelProps {
  summary: DashboardSummary
  genres: GenreSummaryRow[]
  recentItems: AllItemRow[]
  prefs: ListingPrefs
  setPrefs: (partial: Partial<ListingPrefs>) => void
  compact?: boolean
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xl font-bold text-text">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}

export function SummaryPanel({
  summary,
  genres,
  recentItems,
  prefs,
  setPrefs,
  compact = false,
}: SummaryPanelProps) {
  const { t, locale } = useLocale()
  const [showAllGenres, setShowAllGenres] = useState(false)
  const visibleGenres = showAllGenres ? genres : genres.slice(0, 5)

  if (compact) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="w-28 shrink-0">
          <StatTile label={t('dashboard.summary.totalItems')} value={summary.totalItems} />
        </div>
        {ITEM_TYPES.map((type) => (
          <div key={type} className="w-28 shrink-0">
            <StatTile
              label={t(ITEM_TYPE_META[type].labelKey)}
              value={summary.countsByType[type]}
            />
          </div>
        ))}
        <div className="w-28 shrink-0">
          <StatTile
            label={t('dashboard.summary.estValue')}
            value={formatCurrency(summary.estimatedValue, 'EUR', locale)}
          />
        </div>
      </div>
    )
  }

  return (
    <aside className="flex w-full flex-col gap-5">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-text">{t('dashboard.summary.title')}</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatTile label={t('dashboard.summary.totalItems')} value={summary.totalItems} />
          <StatTile
            label={t('dashboard.summary.estValue')}
            value={formatCurrency(summary.estimatedValue, 'EUR', locale)}
          />
          {ITEM_TYPES.map((type) => (
            <StatTile
              key={type}
              label={t(ITEM_TYPE_META[type].labelKey)}
              value={summary.countsByType[type]}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-text">{t('dashboard.quickFilters')}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPrefs({ status: 'owned' })}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              prefs.status === 'owned'
                ? 'border-success bg-success-bg text-success'
                : 'border-border bg-surface text-text hover:bg-card-hover'
            }`}
          >
            {t('status.owned')} ({summary.ownedCount})
          </button>
          <button
            type="button"
            onClick={() => setPrefs({ status: 'wishlist' })}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              prefs.status === 'wishlist'
                ? 'border-wishlist bg-wishlist-bg text-wishlist'
                : 'border-border bg-surface text-text hover:bg-card-hover'
            }`}
          >
            {t('status.wishlist')} ({summary.wishlistCount})
          </button>
        </div>
      </section>

      {genres.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text">{t('dashboard.genres')}</h2>
          <ul className="flex flex-col gap-1.5">
            {visibleGenres.map((genre) => (
              <li key={genre.id} className="flex items-center justify-between text-sm">
                <span className="text-text">{genre.name}</span>
                <span className="text-muted">{genre.count}</span>
              </li>
            ))}
          </ul>
          {genres.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllGenres((v) => !v)}
              className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
            >
              {showAllGenres ? t('dashboard.genresShowLess') : t('dashboard.genresShowMore')}
            </button>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-text">{t('dashboard.recentlyAdded')}</h2>
        {recentItems.length === 0 ? (
          <p className="text-sm text-muted">{t('dashboard.noRecentItems')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentItems.map((item) => {
              const Icon = ITEM_TYPE_META[item.item_type].icon
              return (
                <li key={item.id} className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card-hover text-muted">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{item.title}</p>
                    <p className="truncate text-xs text-muted">
                      {t(ITEM_TYPE_META[item.item_type].labelKey)} ·{' '}
                      {formatRelativeTime(item.created_at, locale)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <Link
          to="/recently-added"
          className="mt-3 block rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm font-medium text-text hover:bg-card-hover"
        >
          {t('dashboard.viewAll')}
        </Link>
      </section>
    </aside>
  )
}
