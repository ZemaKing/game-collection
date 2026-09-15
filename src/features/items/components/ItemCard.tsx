import { Link } from 'react-router-dom'
import { ITEM_TYPE_META, ITEM_TYPE_ROUTES } from '@/features/items/constants'
import { formatCurrency } from '@/features/items/format'
import type { AllItemRow } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface ItemCardProps {
  item: AllItemRow
  platformName: string | null
  view: 'grid' | 'list'
  /** Show an item-type icon/label badge — used on mixed (All Items) results. */
  showTypeBadge?: boolean
}

function StatusPill({ status }: { status: AllItemRow['status'] }) {
  const { t } = useLocale()
  const isOwned = status === 'owned'
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isOwned ? 'bg-success-bg text-success' : 'bg-wishlist-bg text-wishlist'
      }`}
    >
      {t(isOwned ? 'status.owned' : 'status.wishlist')}
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

function CoverPlaceholder({
  item,
  className = '',
}: {
  item: AllItemRow
  className?: string
}) {
  const Icon = ITEM_TYPE_META[item.item_type].icon
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-card-hover text-muted ${className}`}
    >
      <Icon size={28} strokeWidth={1.5} />
    </div>
  )
}

export function ItemCard({ item, platformName, view, showTypeBadge = false }: ItemCardProps) {
  const { t, locale } = useLocale()
  const to = `/${ITEM_TYPE_ROUTES[item.item_type]}/${item.id}`

  if (view === 'list') {
    const typeLabel = showTypeBadge ? t(ITEM_TYPE_META[item.item_type].labelKey) : null
    return (
      <Link
        to={to}
        className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 hover:bg-card-hover"
      >
        <CoverPlaceholder item={item} className="size-14 rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{item.title}</p>
          <p className="truncate text-xs text-muted">
            {[typeLabel, platformName, item.subtitle].filter(Boolean).join(' · ') || ' '}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusPill status={item.status} />
          {item.value != null && (
            <span className="text-xs text-muted">
              {formatCurrency(item.value, item.currency, locale)}
            </span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className="block overflow-hidden rounded-xl border border-border bg-card hover:border-accent"
    >
      <div className="relative">
        <CoverPlaceholder item={item} className="aspect-[3/4] w-full" />
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
          <StatusPill status={item.status} />
          {item.value != null && (
            <span className="text-xs font-medium text-muted">
              {formatCurrency(item.value, item.currency, locale)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
