import { LayoutGrid } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ITEM_TYPES, ITEM_TYPE_COLORS, ITEM_TYPE_META } from '@/features/items/constants'
import { formatRelativeTime } from '@/features/items/format'
import type { DashboardSummary, GenreSummaryRow } from '@/features/items/api'
import type { AllItemRow } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface SummaryPanelProps {
  summary: DashboardSummary
  genres: GenreSummaryRow[]
  recentItems: AllItemRow[]
  compact?: boolean
}

interface StatTileProps {
  label: string
  value: string | number
  icon: ComponentType<{ size?: number; className?: string }>
  iconColor: string
  compact?: boolean
}

function StatTile({ label, value, icon: Icon, iconColor, compact = false }: StatTileProps) {
  if (compact) {
    return (
      <div className="flex min-w-0 grow basis-[22%] flex-col items-start gap-1 rounded-lg border border-border bg-surface px-2 py-2">
        <Icon size={15} className={`shrink-0 ${iconColor}`} />
        <p className="stat-number text-text">{value}</p>
        <p className="stat-label w-full truncate text-muted">{label}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <Icon size={16} className={`mb-1 ${iconColor}`} />
      <p className="stat-number text-text">{value}</p>
      <p className="stat-label text-muted">{label}</p>
    </div>
  )
}

export function SummaryPanel({ summary, genres, recentItems, compact = false }: SummaryPanelProps) {
  const { t, locale } = useLocale()
  const [showAllGenres, setShowAllGenres] = useState(false)
  const visibleGenres = showAllGenres ? genres : genres.slice(0, 5)

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <StatTile
          compact
          icon={LayoutGrid}
          iconColor="text-accent"
          label={t('dashboard.summary.totalItems')}
          value={summary.totalItems}
        />
        {ITEM_TYPES.map((type) => (
          <StatTile
            key={type}
            compact
            icon={ITEM_TYPE_META[type].icon}
            iconColor={ITEM_TYPE_COLORS[type].icon}
            label={t(ITEM_TYPE_META[type].labelKey)}
            value={summary.countsByType[type]}
          />
        ))}
      </div>
    )
  }

  return (
    <aside className="flex w-full flex-col gap-5">
      <section>
        <h2 className="heading-section mb-2 text-text">{t('dashboard.summary.title')}</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            icon={LayoutGrid}
            iconColor="text-accent"
            label={t('dashboard.summary.totalItems')}
            value={summary.totalItems}
          />
          {ITEM_TYPES.map((type) => (
            <StatTile
              key={type}
              icon={ITEM_TYPE_META[type].icon}
              iconColor={ITEM_TYPE_COLORS[type].icon}
              label={t(ITEM_TYPE_META[type].labelKey)}
              value={summary.countsByType[type]}
            />
          ))}
        </div>
      </section>

      {genres.length > 0 && (
        <section>
          <h2 className="heading-section mb-2 text-text">{t('dashboard.genres')}</h2>
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
        <h2 className="heading-section mb-2 text-text">{t('dashboard.recentlyAdded')}</h2>
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
                    <p className="truncate text-sm font-semibold text-text">{item.title}</p>
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
          className="mt-3 block rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm font-semibold text-text hover:bg-card-hover"
        >
          {t('dashboard.viewAll')}
        </Link>
      </section>
    </aside>
  )
}
