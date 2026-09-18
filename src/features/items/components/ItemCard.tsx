import { MoreVertical, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { calculateCompleteness, completenessFactsFromRow } from '@/features/items/completeness'
import {
  CONDITION_COLORS,
  CONDITION_ICONS,
  CONDITION_LABEL_KEYS,
  DEFAULT_GENRE_META,
  GENRE_META,
  ITEM_TYPE_COLORS,
  ITEM_TYPE_META,
  ITEM_TYPE_ROUTES,
  PLATFORM_ICONS,
  PLATFORM_SHORT_LABELS,
} from '@/features/items/constants'
import { CompletenessBadge } from '@/features/items/components/CompletenessBadge'
import { ItemImage } from '@/features/items/components/ItemImage'
import type { AllItemRow } from '@/features/items/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

interface ItemCardProps {
  item: AllItemRow
  platformName: string | null
  /** Slug of the item's platform, used to render the branded badge on grid cards. */
  platformSlug?: string | null
  view: 'grid' | 'list'
  /** Show an item-type icon/label badge — used on mixed (All Items) results. */
  showTypeBadge?: boolean
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

function ConditionBadge({ condition }: { condition: AllItemRow['condition'] }) {
  const { t } = useLocale()
  if (!condition) return null
  const Icon = CONDITION_ICONS[condition]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${CONDITION_COLORS[condition].badge}`}
    >
      <Icon size={12} />
      {t(CONDITION_LABEL_KEYS[condition])}
    </span>
  )
}

function TypeBadge({ item }: { item: AllItemRow }) {
  const { t } = useLocale()
  const meta = ITEM_TYPE_META[item.item_type]
  const Icon = meta.icon
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${ITEM_TYPE_COLORS[item.item_type].badge}`}
    >
      <Icon size={12} />
      {t(meta.labelKey)}
    </span>
  )
}

/** Same type glyph as `TypeBadge`, but with a solid backing so it stays legible over busy cover art. */
function TypeOverlayBadge({ item }: { item: AllItemRow }) {
  const { t } = useLocale()
  const meta = ITEM_TYPE_META[item.item_type]
  const Icon = meta.icon
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
      <Icon size={12} className={ITEM_TYPE_COLORS[item.item_type].icon} />
      {t(meta.labelKey)}
    </span>
  )
}

/** Genre glyph shown on the subtitle row of grid cards, next to developer/publisher. */
function GenreIcon({ slug, name }: { slug: string; name: string | null }) {
  const meta = GENRE_META[slug] ?? DEFAULT_GENRE_META
  const Icon = meta.icon
  return <Icon size={13} className={`shrink-0 ${meta.color.icon}`} aria-label={name ?? undefined} />
}

function PlatformBadge({ platformName, platformSlug }: { platformName: string; platformSlug?: string | null }) {
  const Icon = platformSlug ? PLATFORM_ICONS[platformSlug] : null
  const label = (platformSlug && PLATFORM_SHORT_LABELS[platformSlug]) || platformName
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
      {Icon && <Icon size={12} />}
      {label}
    </span>
  )
}

export function ItemCard({
  item,
  platformName,
  platformSlug = null,
  view,
  showTypeBadge = false,
}: ItemCardProps) {
  const { t } = useLocale()
  const { user } = useAuth()
  const to = `/${ITEM_TYPE_ROUTES[item.item_type]}/${item.id}`
  const editTo = `${to}/edit`
  const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : null
  const completeness = calculateCompleteness(item.item_type, completenessFactsFromRow(item))

  if (view === 'list') {
    const typeLabel = showTypeBadge ? t(ITEM_TYPE_META[item.item_type].labelKey) : null

    return (
      <Link
        to={to}
        className={`flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 hover:bg-card-hover ${FOCUS_RING}`}
      >
        <ItemImage
          storagePath={item.cover_image_path}
          itemType={item.item_type}
          alt={item.title}
          className="aspect-[4/5] w-14 rounded-md md:w-16"
        />

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

        <div className="flex shrink-0 items-center gap-3">
          <CompletenessBadge percent={completeness.percent} compact />
          <ConditionBadge condition={item.condition} />
        </div>
      </Link>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card hover:border-accent">
      <div className="relative">
        <ItemImage storagePath={item.cover_image_path} itemType={item.item_type} alt={item.title} className="aspect-[4/5] w-full" />
        {platformName && (
          <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1">
            <PlatformBadge platformName={platformName} platformSlug={platformSlug} />
            {showTypeBadge && <TypeOverlayBadge item={item} />}
          </div>
        )}
        {!platformName && showTypeBadge && (
          <div className="absolute inset-x-2 top-2 flex items-start justify-end">
            <TypeOverlayBadge item={item} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-1">
          <p className="line-clamp-2 flex-1 text-sm font-semibold text-text">{item.title}</p>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t('form.edit')}
                  onClick={(e) => e.stopPropagation()}
                  className="relative z-10 -mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-card-hover hover:text-text"
                >
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={editTo} className="flex w-full items-center gap-2">
                    <Pencil size={14} />
                    {t('form.edit')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {(item.subtitle || item.genre_slug) && (
          <div className="flex min-w-0 items-center justify-between gap-1.5">
            <p className="min-w-0 flex-1 truncate text-xs text-muted">{item.subtitle}</p>
            {item.genre_slug && <GenreIcon slug={item.genre_slug} name={item.genre_name} />}
          </div>
        )}
        <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
          <ConditionBadge condition={item.condition} />
          {releaseYear && <span className="shrink-0 text-xs text-muted">{releaseYear}</span>}
        </div>
        <CompletenessBadge percent={completeness.percent} compact full />
      </div>
      <Link to={to} aria-label={item.title} className={`absolute inset-0 rounded-xl ${FOCUS_RING}`} />
    </div>
  )
}
