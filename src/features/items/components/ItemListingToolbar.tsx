import {
  Calendar,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Gamepad2,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag as TagIcon,
  Type as TypeIcon,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { CloseIcon } from '@/components/icons/ActionIcons'
import { ButtonIcon } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { SORT_KEYS, type SortKey, type Tag } from '@/features/items/api'
import {
  CONDITION_COLORS,
  CONDITION_ICONS,
  CONDITION_LABEL_KEYS,
  DEFAULT_GENRE_META,
  GENRE_META,
  ITEM_TYPE_COLORS,
  ITEM_TYPE_META,
  PLATFORM_ICONS,
} from '@/features/items/constants'
import { FilterSheet } from '@/features/items/components/FilterSheet'
import type { ViewMode } from '@/features/items/useListingPrefs'
import type { Filters } from '@/features/items/useFilters'
import type { Genre, ItemCondition, ItemType, Platform } from '@/features/items/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useLocale } from '@/hooks/useLocale'
import type { TranslationKey } from '@/lib/i18n'

const SORT_LABEL_KEYS: Record<SortKey, TranslationKey> = {
  recently_added: 'sort.recently_added',
  title: 'sort.title',
  release_date: 'sort.release_date',
  last_updated: 'sort.last_updated',
}

const SORT_ICONS: Record<SortKey, LucideIcon> = {
  recently_added: Clock,
  title: TypeIcon,
  release_date: Calendar,
  last_updated: RefreshCw,
}

interface Chip {
  key: string
  label: string
  onRemove: () => void
  icon?: ComponentType<{ size?: number; className?: string }>
  iconColor?: string
}

interface ItemListingToolbarProps {
  filters: Filters
  setFilters: (partial: Partial<Filters>) => void
  clearAll: () => void
  view: ViewMode
  setView: (view: ViewMode) => void
  platforms: Platform[]
  genres: Genre[]
  tags: Tag[]
  years: number[]
  /** Hide the item-type facet on single-type listing pages. */
  showTypeFilter?: boolean
  /** Hide the platform facet on per-platform listing pages. */
  showPlatformFilter?: boolean
  /** Hide the genre facet where it can never match (non-game type pages). */
  showGenreFilter?: boolean
}

export function ItemListingToolbar({
  filters,
  setFilters,
  clearAll,
  view,
  setView,
  platforms,
  genres,
  tags,
  years,
  showTypeFilter = true,
  showPlatformFilter = true,
  showGenreFilter = true,
}: ItemListingToolbarProps) {
  const { t } = useLocale()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [searchDraft, setSearchDraft] = useState(filters.search)

  // Re-seed the draft whenever the applied search changes from outside this
  // component (clear-all, browser back/forward), during render rather than
  // in an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  const [lastAppliedSearch, setLastAppliedSearch] = useState(filters.search)
  if (filters.search !== lastAppliedSearch) {
    setLastAppliedSearch(filters.search)
    setSearchDraft(filters.search)
  }

  useEffect(() => {
    const trimmed = searchDraft.trim()
    if (trimmed === filters.search) return
    const timeout = setTimeout(() => setFilters({ search: trimmed }), 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p])), [platforms])
  const genreById = useMemo(() => new Map(genres.map((g) => [g.id, g])), [genres])
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag.name])), [tags])

  const chips: Chip[] = [
    ...(showTypeFilter ? filters.itemTypes : []).map((type: ItemType) => ({
      key: `type:${type}`,
      label: t(ITEM_TYPE_META[type].labelKey),
      onRemove: () => setFilters({ itemTypes: filters.itemTypes.filter((v) => v !== type) }),
      icon: ITEM_TYPE_META[type].icon,
      iconColor: ITEM_TYPE_COLORS[type].icon,
    })),
    ...(showPlatformFilter ? filters.platformIds : []).map((id) => {
      const platform = platformById.get(id)
      return {
        key: `platform:${id}`,
        label: platform?.name ?? id,
        onRemove: () => setFilters({ platformIds: filters.platformIds.filter((v) => v !== id) }),
        icon: platform ? (PLATFORM_ICONS[platform.slug] ?? Gamepad2) : Gamepad2,
        iconColor: 'text-sky-400',
      }
    }),
    ...(showGenreFilter ? filters.genreIds : []).map((id) => {
      const genre = genreById.get(id)
      const meta = genre ? (GENRE_META[genre.slug] ?? DEFAULT_GENRE_META) : DEFAULT_GENRE_META
      return {
        key: `genre:${id}`,
        label: genre?.name ?? id,
        onRemove: () => setFilters({ genreIds: filters.genreIds.filter((v) => v !== id) }),
        icon: meta.icon,
        iconColor: meta.color.icon,
      }
    }),
    ...filters.years.map((year) => ({
      key: `year:${year}`,
      label: String(year),
      onRemove: () => setFilters({ years: filters.years.filter((v) => v !== year) }),
      icon: Calendar,
      iconColor: 'text-muted',
    })),
    ...filters.conditions.map((condition: ItemCondition) => ({
      key: `condition:${condition}`,
      label: t(CONDITION_LABEL_KEYS[condition]),
      onRemove: () => setFilters({ conditions: filters.conditions.filter((v) => v !== condition) }),
      icon: CONDITION_ICONS[condition],
      iconColor: CONDITION_COLORS[condition].icon,
    })),
    ...filters.tagIds.map((id) => ({
      key: `tag:${id}`,
      label: tagById.get(id) ?? id,
      onRemove: () => setFilters({ tagIds: filters.tagIds.filter((v) => v !== id) }),
      icon: TagIcon,
      iconColor: 'text-muted',
    })),
    ...(filters.collectionDateFrom || filters.collectionDateTo
      ? [
          {
            key: 'collectionDate',
            label: [filters.collectionDateFrom, filters.collectionDateTo].filter(Boolean).join(' – '),
            onRemove: () => setFilters({ collectionDateFrom: null, collectionDateTo: null }),
            icon: CalendarRange,
            iconColor: 'text-muted',
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-3 text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card-hover text-text">
            <SlidersHorizontal size={18} />
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold text-text">{t('filters.title')}</span>
            {chips.length > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-fg">
                {chips.length}
              </span>
            )}
          </span>
        </button>

        <div className="flex items-center gap-3">
          {chips.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className={buttonClasses({ size: 'sm' })}
            >
              <ButtonIcon icon={CloseIcon} size="sm" />
              {t('filters.clearAll')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={t('filters.title')}
            aria-expanded={expanded}
            className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-card-hover hover:text-text"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={t('filters.searchPlaceholder')}
              className="w-full rounded-full border border-border bg-bg py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex items-end gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-sm font-semibold text-text">{t('sort.label')}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm font-semibold text-text hover:bg-card-hover"
                  >
                    {(() => {
                      const SortIcon = SORT_ICONS[filters.sort]
                      return <SortIcon size={16} className="shrink-0 text-muted" />
                    })()}
                    <span className="flex-1 text-left">{t(SORT_LABEL_KEYS[filters.sort])}</span>
                    <ChevronDown size={16} className="text-muted" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-56">
                  {SORT_KEYS.map((key: SortKey) => {
                    const SortIcon = SORT_ICONS[key]
                    return (
                      <DropdownMenuItem key={key} onSelect={() => setFilters({ sort: key })}>
                        <SortIcon size={15} className="shrink-0 text-muted" />
                        <span className="flex-1">{t(SORT_LABEL_KEYS[key])}</span>
                        {filters.sort === key && <Check size={16} />}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-1.5">
              <span className="text-sm font-semibold text-text">{t('view.label')}</span>
              <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-bg p-1">
                <button
                  type="button"
                  aria-label={t('view.grid')}
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    view === 'grid' ? 'bg-accent text-accent-fg' : 'text-muted hover:text-text'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  aria-label={t('view.list')}
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    view === 'list' ? 'bg-accent text-accent-fg' : 'text-muted hover:text-text'
                  }`}
                >
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text">{t('filters.activeFilters')}</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm font-semibold text-accent hover:text-accent-hover"
                >
                  {t('filters.clearAll')}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {chips.map((chip) => {
                  const ChipIcon = chip.icon
                  return (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1.5 rounded-full bg-card-hover px-3 py-1.5 text-sm font-medium text-text"
                    >
                      {ChipIcon && <ChipIcon size={14} className={chip.iconColor ?? 'text-muted'} />}
                      {chip.label}
                      <button
                        type="button"
                        onClick={chip.onRemove}
                        aria-label={t('filters.removeChip')}
                        className="text-muted hover:text-text"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        onApply={setFilters}
        showTypeFilter={showTypeFilter}
        showPlatformFilter={showPlatformFilter}
        showGenreFilter={showGenreFilter}
        platforms={platforms}
        genres={genres}
        tags={tags}
        years={years}
      />
    </div>
  )
}
