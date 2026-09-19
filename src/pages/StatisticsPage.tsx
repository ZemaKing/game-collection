import { BarChart3, CalendarPlus, CheckCircle2, Gauge, LayoutGrid, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon } from '@/components/icons/ActionIcons'
import { ButtonIcon } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  CONDITION_COLORS,
  CONDITION_ICONS,
  CONDITION_LABEL_KEYS,
  DEFAULT_GENRE_META,
  GENRE_META,
  ITEM_TYPE_COLORS,
  ITEM_TYPE_META,
  ITEM_TYPE_ROUTES,
  ITEM_TYPES,
  PLATFORM_ICONS,
} from '@/features/items/constants'
import { BarList, ColumnChart, StatCard, type BarListEntry, type ColumnEntry } from '@/features/statistics/charts'
import { MONTHS_SHOWN, RECENT_WINDOW_DAYS } from '@/features/statistics/statistics'
import { useStatistics } from '@/features/statistics/useStatistics'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import type { Locale } from '@/lib/i18n'

const GENRES_COLLAPSED = 6

// Same Latin-script pinning as features/items/format.ts.
const INTL_LOCALE: Record<Locale, string> = { sr: 'sr-Latn-RS', en: 'en-US' }

function share(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100)
}

function MetricTile({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <Icon size={16} className={`mb-1 ${iconColor}`} />
      <p className="stat-number text-text">{value}</p>
      <p className="stat-label text-muted">{label}</p>
    </div>
  )
}

function StatisticsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-56 rounded-lg md:col-span-2" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  )
}

function StatisticsPage() {
  const { t, locale } = useLocale()
  const { user } = useAuth()
  const { data, stats, loading, error, reload } = useStatistics()
  const [showAllGenres, setShowAllGenres] = useState(false)

  const typeEntries = useMemo<BarListEntry[]>(() => {
    if (!stats) return []
    return ITEM_TYPES.map((type) => ({
      key: type,
      label: t(ITEM_TYPE_META[type].labelKey),
      count: stats.byType[type],
      percent: share(stats.byType[type], stats.total),
      icon: ITEM_TYPE_META[type].icon,
      colorClass: ITEM_TYPE_COLORS[type].icon,
      to: `/${ITEM_TYPE_ROUTES[type]}`,
    }))
  }, [stats, t])

  const platformEntries = useMemo<BarListEntry[]>(() => {
    if (!stats || !data) return []
    const platformById = new Map(data.platforms.map((p) => [p.id, p]))
    const platformTotal = stats.byPlatform.reduce((sum, p) => sum + p.count, 0)
    return stats.byPlatform.map(({ platformId, count }) => {
      const platform = platformId ? platformById.get(platformId) : undefined
      return {
        key: platformId ?? 'none',
        label: platform?.name ?? t('stats.notSet'),
        count,
        percent: share(count, platformTotal),
        icon: platform ? PLATFORM_ICONS[platform.slug] : undefined,
        to: platform ? `/platforms/${platform.slug}` : undefined,
      }
    })
  }, [stats, data, t])

  const genreEntries = useMemo<BarListEntry[]>(() => {
    if (!data) return []
    return data.genres.map((genre) => {
      const meta = GENRE_META[genre.slug] ?? DEFAULT_GENRE_META
      return {
        key: genre.id,
        label: genre.name,
        count: genre.count,
        icon: meta.icon,
        colorClass: meta.color.icon,
        to: `/games?genre=${genre.id}`,
      }
    })
  }, [data])

  const conditionEntries = useMemo<BarListEntry[]>(() => {
    if (!stats) return []
    return stats.byCondition.map(({ condition, count }) => ({
      key: condition ?? 'none',
      label: condition ? t(CONDITION_LABEL_KEYS[condition]) : t('stats.notSet'),
      count,
      percent: share(count, stats.total),
      icon: condition ? CONDITION_ICONS[condition] : undefined,
      colorClass: condition ? CONDITION_COLORS[condition].icon : undefined,
      to: condition ? `/items?condition=${condition}` : undefined,
    }))
  }, [stats, t])

  const completenessEntries = useMemo<BarListEntry[]>(() => {
    if (!stats) return []
    return stats.completeness.buckets.map(({ min, max, count }) => ({
      key: String(min),
      label: min === max ? `${min}%` : `${min}–${max}%`,
      count,
      percent: share(count, stats.total),
    }))
  }, [stats])

  const monthEntries = useMemo<ColumnEntry[]>(() => {
    if (!stats) return []
    const intl = INTL_LOCALE[locale]
    const short = new Intl.DateTimeFormat(intl, { month: 'short' })
    const long = new Intl.DateTimeFormat(intl, { month: 'long', year: 'numeric' })
    return stats.monthly.map((m) => {
      const date = new Date(m.year, m.month, 1)
      return { key: m.key, label: short.format(date), fullLabel: long.format(date), count: m.count }
    })
  }, [stats, locale])

  const visibleGenres = showAllGenres ? genreEntries : genreEntries.slice(0, GENRES_COLLAPSED)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
          <BarChart3 size={22} className="text-muted" />
          {t('nav.statistics')}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('stats.subtitle')}</p>
      </div>

      {error && <ErrorState message={t('stats.error', { message: error })} onRetry={reload} />}

      {loading && <StatisticsSkeleton />}

      {stats && data && stats.total === 0 && (
        <EmptyState
          icon={BarChart3}
          body={t('stats.empty')}
          action={
            user ? (
              <Link to="/items/new" className={buttonClasses({ className: 'mt-2' })}>
                <ButtonIcon icon={PlusIcon} />
                {t('listing.emptyCollectionCta')}
              </Link>
            ) : undefined
          }
        />
      )}

      {stats && data && stats.total > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              icon={LayoutGrid}
              iconColor="text-accent"
              label={t('dashboard.summary.totalItems')}
              value={stats.total}
            />
            <MetricTile
              icon={Gauge}
              iconColor="text-sky-400"
              label={t('stats.averageCompleteness')}
              value={`${stats.completeness.average}%`}
            />
            <MetricTile
              icon={CalendarPlus}
              iconColor="text-emerald-400"
              label={t('stats.addedRecently', { days: String(RECENT_WINDOW_DAYS) })}
              value={stats.addedLastWindow}
            />
            <MetricTile
              icon={CheckCircle2}
              iconColor="text-amber-400"
              label={t('stats.fullyComplete')}
              value={stats.completeness.complete}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatCard title={t('stats.byType')}>
              <BarList entries={typeEntries} label={t('stats.byType')} />
            </StatCard>

            <StatCard title={t('completeness.heading')} note={t('stats.completenessNote')}>
              <BarList entries={completenessEntries} label={t('completeness.heading')} />
            </StatCard>

            <StatCard
              title={t('stats.additions')}
              note={t('stats.additionsNote', { months: String(MONTHS_SHOWN) })}
              className="md:col-span-2"
            >
              <ColumnChart
                entries={monthEntries}
                caption={t('stats.additionsCaption')}
                columnHeader={t('stats.month')}
                valueHeader={t('stats.items')}
              />
              {stats.earlierCount > 0 && (
                <p className="mt-2 text-xs text-muted">
                  {t('stats.additionsEarlier', { count: String(stats.earlierCount) })}
                </p>
              )}
            </StatCard>

            {platformEntries.length > 0 && (
              <StatCard title={t('stats.byPlatform')} note={t('stats.byPlatformNote')}>
                <BarList entries={platformEntries} label={t('stats.byPlatform')} />
              </StatCard>
            )}

            {conditionEntries.length > 0 && (
              <StatCard title={t('stats.byCondition')}>
                <BarList entries={conditionEntries} label={t('stats.byCondition')} />
              </StatCard>
            )}

            {genreEntries.length > 0 && (
              <StatCard title={t('stats.byGenre')} note={t('stats.byGenreNote')}>
                <BarList entries={visibleGenres} label={t('stats.byGenre')} />
                {genreEntries.length > GENRES_COLLAPSED && (
                  <button
                    type="button"
                    onClick={() => setShowAllGenres((v) => !v)}
                    className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    {showAllGenres ? t('dashboard.genresShowLess') : t('dashboard.genresShowMore')}
                  </button>
                )}
              </StatCard>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default StatisticsPage
