import { Link } from 'react-router-dom'
import { CONDITION_LABEL_KEYS, ITEM_TYPE_META, ITEM_TYPE_ROUTES } from '@/features/items/constants'
import { CoverPlaceholder } from '@/features/items/components/CoverPlaceholder'
import type { AllItemRow } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface ItemCardProps {
  item: AllItemRow
  platformName: string | null
  view: 'grid' | 'list'
  /** Show an item-type icon/label badge — used on mixed (All Items) results. */
  showTypeBadge?: boolean
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

function ConditionBadge({ condition }: { condition: AllItemRow['condition'] }) {
  const { t } = useLocale()
  if (!condition) return null
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-card-hover px-2 py-0.5 text-xs font-medium text-muted">
      {t(CONDITION_LABEL_KEYS[condition])}
    </span>
  )
}

function TypeBadge({ item }: { item: AllItemRow }) {
  const { t } = useLocale()
  const Icon = ITEM_TYPE_META[item.item_type].icon
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-surface/90 px-1.5 py-0.5 text-xs font-medium text-text shadow-sm backdrop-blur">
      <Icon size={12} />
      {t(ITEM_TYPE_META[item.item_type].labelKey)}
    </span>
  )
}

export function ItemCard({ item, platformName, view, showTypeBadge = false }: ItemCardProps) {
  const { t } = useLocale()
  const to = `/${ITEM_TYPE_ROUTES[item.item_type]}/${item.id}`
  const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : null

  if (view === 'list') {
    const typeLabel = showTypeBadge ? t(ITEM_TYPE_META[item.item_type].labelKey) : null

    return (
      <Link
        to={to}
        className={`flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 hover:bg-card-hover ${FOCUS_RING}`}
      >
        <CoverPlaceholder itemType={item.item_type} className="size-14 rounded-md md:size-16" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{item.title}</p>
          {/* Mobile: one compact combined line. Desktop/tablet: subtitle only, the rest moves into dedicated columns below. */}
          <p className="truncate text-xs text-muted md:hidden">
            {[typeLabel, platformName, item.subtitle].filter(Boolean).join(' · ') || ' '}
          </p>
          <p className="hidden truncate text-xs text-muted md:block">{item.subtitle || ' '}</p>
        </div>

        <div className="hidden shrink-0 items-center gap-4 md:flex">
          {showTypeBadge && <TypeBadge item={item} />}
          <span className="w-28 truncate text-xs text-muted">{platformName ?? '—'}</span>
          <span className="w-10 text-xs text-muted">{releaseYear ?? '—'}</span>
        </div>

        <div className="flex shrink-0 items-center">
          <ConditionBadge condition={item.condition} />
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className={`block overflow-hidden rounded-xl border border-border bg-card hover:border-accent ${FOCUS_RING}`}
    >
      <div className="relative">
        <CoverPlaceholder itemType={item.item_type} className="aspect-[3/4] w-full" />
        {platformName && (
          <span className="absolute top-2 left-2 rounded-md bg-surface/90 px-1.5 py-0.5 text-xs font-medium text-text shadow-sm backdrop-blur">
            {platformName}
          </span>
        )}
        {showTypeBadge && (
          <span className="absolute top-2 right-2">
            <TypeBadge item={item} />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-text">{item.title}</p>
        {item.subtitle && <p className="truncate text-xs text-muted">{item.subtitle}</p>}
        <div className="mt-1 flex items-center justify-between gap-2">
          <ConditionBadge condition={item.condition} />
          {releaseYear && <span className="text-xs text-muted">{releaseYear}</span>}
        </div>
      </div>
    </Link>
  )
}
