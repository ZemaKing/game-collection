import {
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gamepad2,
  Gauge,
  LayoutGrid,
  LogIn,
  LogOut,
  Plus,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonIcon } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ITEM_TYPE_COLORS,
  ITEM_TYPE_META,
  ITEM_TYPE_ROUTES,
  ITEM_TYPES,
} from '@/features/items/constants'
import { formatMonthYear } from '@/features/items/format'
import { MetricTile } from '@/features/statistics/charts'
import { collectionSince, RECENT_WINDOW_DAYS } from '@/features/statistics/statistics'
import { useStatistics } from '@/features/statistics/useStatistics'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import type { TranslationKey } from '@/lib/i18n'

const EXPLORE_LINKS: { to: string; icon: LucideIcon; labelKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { to: '/recently-added', icon: Clock, labelKey: 'nav.recentlyAdded', descriptionKey: 'profile.recentlyAddedDesc' },
  { to: '/statistics', icon: BarChart3, labelKey: 'nav.statistics', descriptionKey: 'profile.statisticsDesc' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings', descriptionKey: 'profile.settingsDesc' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="heading-section text-text">{title}</h2>
      {children}
    </section>
  )
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function ProfilePage() {
  const { t, locale } = useLocale()
  const { user, signOut } = useAuth()
  const { stats, data, loading, error, reload } = useStatistics()

  const since = useMemo(() => (data ? collectionSince(data.rows) : null), [data])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 md:gap-5 md:p-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent-solid text-accent-fg md:size-20">
          <Gamepad2 size={32} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold break-words text-text md:text-2xl">{t('sidebar.title')}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>{t('profile.subtitle')}</span>
            {user && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-text">
                {t('profile.ownerBadge')}
              </span>
            )}
          </p>
          {/* Reserve the line while loading so the header doesn't jump when it fills in. */}
          <p className="mt-1 min-h-5 text-sm text-muted">
            {since && t('profile.since', { date: formatMonthYear(since, locale) })}
          </p>
        </div>
      </header>

      {error && <ErrorState message={t('profile.error', { message: error })} onRetry={reload} />}

      {loading && <OverviewSkeleton />}

      {stats && (
        <Section title={t('profile.overview')}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              icon={LayoutGrid}
              iconColor="text-accent"
              label={t('dashboard.summary.totalItems')}
              value={stats.total}
            />
            <MetricTile
              icon={Gauge}
              iconColor="text-sky-600 dark:text-sky-400"
              label={t('stats.averageCompleteness')}
              value={`${stats.completeness.average}%`}
            />
            <MetricTile
              icon={CalendarPlus}
              iconColor="text-emerald-600 dark:text-emerald-400"
              label={t('stats.addedRecently', { days: String(RECENT_WINDOW_DAYS) })}
              value={stats.addedLastWindow}
            />
            <MetricTile
              icon={CheckCircle2}
              iconColor="text-amber-600 dark:text-amber-400"
              label={t('stats.fullyComplete')}
              value={stats.completeness.complete}
            />
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ITEM_TYPES.map((type) => {
              const { icon: Icon, labelKey } = ITEM_TYPE_META[type]
              return (
                <li key={type}>
                  <Link
                    to={`/${ITEM_TYPE_ROUTES[type]}`}
                    className="flex h-full items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <Icon size={18} className={`shrink-0 ${ITEM_TYPE_COLORS[type].icon}`} />
                    <span className="min-w-0">
                      <span className="block text-lg leading-tight font-bold tabular-nums text-text">
                        {stats.byType[type]}
                      </span>
                      <span className="block truncate text-xs text-muted">{t(labelKey)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      <Section title={t('profile.explore')}>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {EXPLORE_LINKS.map(({ to, icon: Icon, labelKey, descriptionKey }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex h-full items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icon size={20} className="shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-text">{t(labelKey)}</span>
                  <span className="mt-0.5 block text-xs text-muted">{t(descriptionKey)}</span>
                </span>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('profile.account')}>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {user ? (
              <>
                <p className="text-sm font-semibold break-words text-text">
                  {t('profile.signedInAs', { email: user.email ?? t('topbar.collector') })}
                </p>
                <p className="mt-0.5 text-xs text-muted">{t('profile.ownerNote')}</p>
              </>
            ) : (
              <p className="text-sm text-muted">{t('profile.visitorNote')}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <Link to="/items/new" className={buttonClasses({ variant: 'primary' })}>
                  <ButtonIcon icon={Plus} variant="primary" />
                  {t('sidebar.addNewItem')}
                </Link>
                <Button icon={LogOut} onClick={() => signOut()}>
                  {t('auth.signOut')}
                </Button>
              </>
            ) : (
              <Link to="/login" className={buttonClasses()}>
                <ButtonIcon icon={LogIn} />
                {t('auth.signIn')}
              </Link>
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}

export default ProfilePage
