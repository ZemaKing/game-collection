import { Gamepad2, LayoutGrid } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ITEM_TYPE_COLORS, ITEM_TYPE_META, ITEM_TYPE_ROUTES, ITEM_TYPES } from '@/features/items/constants'
import { formatRelativeTime } from '@/features/items/format'
import type { DashboardSummary, GenreSummaryRow } from '@/features/items/api'
import type { AllItemRow } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

const GENRE_ICON_COLORS = ITEM_TYPES.map((type) => ITEM_TYPE_COLORS[type].icon)

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
  hoverBorder: string
  to: string
  compact?: boolean
}

function StatTile({ label, value, icon: Icon, iconColor, hoverBorder, to, compact = false }: StatTileProps) {
  if (compact) {
    return (
      <Link
        to={to}
        className={`flex min-w-0 grow basis-[calc(50%-0.25rem)] items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-colors md:basis-0 md:flex-col md:text-center ${hoverBorder}`}
      >
        <Icon size={18} className={`shrink-0 ${iconColor}`} />
        <div className="flex min-w-0 flex-col md:w-full md:items-center">
          <p className="stat-number text-text">{value}</p>
          <p className="stat-label w-full truncate text-muted">{label}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className={`block rounded-lg border border-border bg-surface p-3 transition-colors ${hoverBorder}`}
    >
      <Icon size={16} className={`mb-1 ${iconColor}`} />
      <p className="stat-number text-text">{value}</p>
      <p className="stat-label text-muted">{label}</p>
    </Link>
  )
}

export function SummaryPanel({ summary, genres, recentItems, compact = false }: SummaryPanelProps) {
  const { t, locale } = useLocale()
  const [showAllGenres, setShowAllGenres] = useState(false)
  const visibleGenres = showAllGenres ? genres : genres.slice(0, 5)

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <StatTile
          compact
          to="/items"
          icon={LayoutGrid}
          iconColor="text-accent"
          hoverBorder="hover:border-accent/60"
          label={t('dashboard.summary.totalItems')}
          value={summary.totalItems}
        />
        {ITEM_TYPES.map((type) => (
          <StatTile
            key={type}
            compact
            to={`/${ITEM_TYPE_ROUTES[type]}`}
            icon={ITEM_TYPE_META[type].icon}
            iconColor={ITEM_TYPE_COLORS[type].icon}
            hoverBorder={ITEM_TYPE_COLORS[type].hoverBorder}
            label={t(ITEM_TYPE_META[type].labelKey)}
            value={summary.countsByType[type]}
          />
        ))}
      </div>
    )
  }

  return (
    <aside className="flex w-full flex-col gap-5">
      {genres.length > 0 && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="heading-section mb-3 text-text">{t('dashboard.genres')}</h2>
          <ul className="flex flex-col gap-2.5">
            {visibleGenres.map((genre, index) => (
              <li key={genre.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2.5">
                  <Gamepad2
                    size={16}
                    className={`shrink-0 ${GENRE_ICON_COLORS[index % GENRE_ICON_COLORS.length]}`}
                  />
                  <span className="truncate text-text">{genre.name}</span>
                </span>
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

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="heading-section mb-3 text-text">{t('dashboard.recentlyAdded')}</h2>
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
