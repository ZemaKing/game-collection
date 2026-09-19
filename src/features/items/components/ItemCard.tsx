import { MoreVertical, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { calculateCompleteness, completenessFactsFromRow } from '@/features/items/completeness'
import {
  CONDITION_COLORS,
  CONDITION_ICONS,
  CONDITION_LABEL_KEYS,
  DEFAULT_GENRE_META,
  FORMAT_TAG_META,
  GENRE_META,
  ITEM_TYPE_COLORS,
  ITEM_TYPE_META,
  ITEM_TYPE_ROUTES,
  PLATFORM_ICONS,
  PLATFORM_SHORT_LABELS,
} from '@/features/items/constants'
import { CompletenessBadge } from '@/features/items/components/CompletenessBadge'
import { EditionBadge } from '@/features/items/components/EditionBadge'
import { editionNameOf, hasEditionField } from '@/features/items/editions'
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

/** Icon-only Digital / Physical marker for the bottom-left corner of a cover image. */
function FormatOverlayBadge({ slug, size = 'md' }: { slug?: string | null; size?: 'sm' | 'md' }) {
  const { t } = useLocale()
  const meta = slug ? FORMAT_TAG_META[slug] : undefined
  if (!meta) return null
  const Icon = meta.icon
  const box = size === 'sm' ? 'bottom-1 left-1 p-1' : 'bottom-2 left-2 p-1.5'
  return (
    <span
      title={t(meta.labelKey)}
      role="img"
      aria-label={t(meta.labelKey)}
      className={`absolute ${box} inline-flex items-center justify-center rounded-md bg-black/50 ${meta.color}`}
    >
      <Icon size={size === 'sm' ? 12 : 16} />
    </span>
  )
}

/** Genre pill — same design as the genre badges on the item detail screen. */
function GenreBadge({ slug, name }: { slug: string; name: string | null }) {
  const meta = GENRE_META[slug] ?? DEFAULT_GENRE_META
  const Icon = meta.icon
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.color.badge}`}
    >
      <Icon size={13} />
      {name}
    </span>
  )
}

/** Icon + name for plain (non-overlay) platform text, e.g. list rows. */
function PlatformLabel({
  platformName,
  platformSlug,
  className = '',
}: {
  platformName: string
  platformSlug?: string | null
  className?: string
}) {
  const Icon = platformSlug ? PLATFORM_ICONS[platformSlug] : null
  return (
    <span className={`inline-flex min-w-0 items-center gap-1 ${className}`}>
      {Icon && <Icon size={12} className="shrink-0" />}
      <span className="truncate">{platformName}</span>
    </span>
  )
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

/**
 * The secondary line under the title in list rows: the subtitle text (developer,
 * publisher, ...) plus the item's `EditionBadge`. For special editions/steelbooks
 * the subtitle *is* the edition name, so only the badge is shown. The negative
 * margin keeps the badge from making the row taller than plain text.
 */
function Subtitle({ item, className = '' }: { item: AllItemRow; className?: string }) {
  const editionName = editionNameOf(item)
  const text = hasEditionField(item.item_type) && item.item_type !== 'game' ? null : item.subtitle
  return (
    <div className={`flex min-h-4 min-w-0 items-center gap-1.5 ${className}`}>
      {text && <p className="min-w-0 truncate text-xs text-muted">{text}</p>}
      {editionName && <EditionBadge name={editionName} size="sm" className="-my-0.5 max-w-[65%] shrink-0" />}
      {!text && !editionName && <p className="text-xs"> </p>}
    </div>
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

    const shortPlatform = (platformSlug && PLATFORM_SHORT_LABELS[platformSlug]) || platformName
    const editionName = editionNameOf(item)
    // For special editions/steelbooks the subtitle *is* the edition name, so it's shown only as the badge.
    const publisher = hasEditionField(item.item_type) && item.item_type !== 'game' ? null : item.subtitle

    return (
      <Link
        to={to}
        className={`flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 hover:bg-card-hover ${FOCUS_RING}`}
      >
        <div className="relative aspect-[4/5] w-14 shrink-0 self-stretch md:w-16">
          <ItemImage
            storagePath={item.cover_image_path}
            itemType={item.item_type}
            alt={item.title}
            className="h-full w-full rounded-md"
          />
          <FormatOverlayBadge slug={item.format_slug} size="sm" />
        </div>

        {/* Mobile (<md): title, publisher, compact genre·platform·year line, completeness+condition. */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 md:hidden">
          <p className="truncate text-sm font-semibold text-text">{item.title}</p>
          {editionNameOf(item) ? (
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
              {typeLabel && <span className="shrink-0">{typeLabel} ·</span>}
              {item.item_type === 'game' && item.subtitle && <span className="min-w-0 truncate">{item.subtitle}</span>}
              <EditionBadge name={editionNameOf(item) ?? ''} size="sm" className="-my-0.5 max-w-[65%] shrink-0" />
            </div>
          ) : (
            <p className="truncate text-xs text-muted">{[typeLabel, item.subtitle].filter(Boolean).join(' · ') || ' '}</p>
          )}
          <div className="flex min-w-0 items-center gap-1.5">
            {item.genre_slug && <GenreBadge slug={item.genre_slug} name={item.genre_name} />}
            <span className="flex min-w-0 items-center gap-1 truncate text-xs text-muted">
              {shortPlatform && (
                <PlatformLabel platformName={shortPlatform} platformSlug={platformSlug} className="shrink-0" />
              )}
              {releaseYear && <span>· {releaseYear}</span>}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <CompletenessBadge percent={completeness.percent} compact />
            <ConditionBadge condition={item.condition} />
          </div>
        </div>

        {/* Tablet (md–lg): title/publisher + completeness/condition on top, genre/platform/year below. */}
        <div className="hidden min-w-0 flex-1 flex-col justify-center gap-1.5 lg:hidden md:flex">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{item.title}</p>
              <Subtitle item={item} />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <CompletenessBadge percent={completeness.percent} compact />
              <ConditionBadge condition={item.condition} />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-4">
            {showTypeBadge && <TypeBadge item={item} />}
            {item.genre_slug && <GenreBadge slug={item.genre_slug} name={item.genre_name} />}
            {platformName ? (
              <PlatformLabel platformName={platformName} platformSlug={platformSlug} className="text-xs text-muted" />
            ) : (
              <span className="text-xs text-muted">—</span>
            )}
            <span className="shrink-0 text-xs text-muted">{releaseYear ?? '—'}</span>
          </div>
        </div>

        {/* Desktop (lg+): original horizontal table columns. */}
        <div className="hidden min-w-0 flex-1 flex-col justify-center gap-1 py-1 lg:flex">
          <p className="truncate text-sm font-semibold text-text">{item.title}</p>
          {publisher && <p className="truncate text-xs text-muted">{publisher}</p>}
          {editionName && (
            <div className="flex min-w-0">
              <EditionBadge name={editionName} size="sm" className="max-w-full" />
            </div>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-6 lg:flex">
          {showTypeBadge && <TypeBadge item={item} />}
          <div className="flex w-28 justify-start">
            {item.genre_slug && <GenreBadge slug={item.genre_slug} name={item.genre_name} />}
          </div>
          {platformName ? (
            <PlatformLabel platformName={platformName} platformSlug={platformSlug} className="w-32 text-xs text-muted" />
          ) : (
            <span className="w-32 text-xs text-muted">—</span>
          )}
          <span className="w-10 text-xs text-muted">{releaseYear ?? '—'}</span>
        </div>
        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <CompletenessBadge percent={completeness.percent} compact />
          <div className="flex w-28 justify-end">
            <ConditionBadge condition={item.condition} />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-accent">
      <div className="relative">
        <ItemImage storagePath={item.cover_image_path} itemType={item.item_type} alt={item.title} className="aspect-[4/5] w-full" />
        <FormatOverlayBadge slug={item.format_slug} />
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
      <div className="flex flex-1 flex-col gap-1.5 p-3">
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
        {/* Everything below the title is pinned to the bottom so publisher/genre, year/condition and
            completeness line up across cards in a row, however many lines the title takes. */}
        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          {item.item_type === 'game' && editionNameOf(item) && (
            <div className="flex min-w-0">
              <EditionBadge name={editionNameOf(item) ?? ''} size="sm" />
            </div>
          )}
          {(item.subtitle || item.genre_slug) && (
            <div className="flex min-w-0 items-center justify-between gap-1.5">
              {hasEditionField(item.item_type) && item.item_type !== 'game' ? (
                <div className="flex min-w-0 flex-1">
                  <EditionBadge name={editionNameOf(item) ?? ''} size="sm" className="-my-0.5" />
                </div>
              ) : (
                <p className="min-w-0 flex-1 truncate text-xs text-muted">{item.subtitle}</p>
              )}
              {item.genre_slug && <GenreBadge slug={item.genre_slug} name={item.genre_name} />}
            </div>
          )}
          <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
            <span className="shrink-0 text-xs text-muted">{releaseYear}</span>
            <ConditionBadge condition={item.condition} />
          </div>
          <CompletenessBadge percent={completeness.percent} compact full />
        </div>
      </div>
      <Link to={to} aria-label={item.title} className={`absolute inset-0 rounded-xl ${FOCUS_RING}`} />
    </div>
  )
}
