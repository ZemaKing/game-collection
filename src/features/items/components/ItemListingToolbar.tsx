import { Check, ChevronDown, LayoutGrid, List as ListIcon, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { SORT_KEYS, type SortKey, type Tag } from '@/features/items/api'
import { CONDITION_LABEL_KEYS, ITEM_TYPE_META } from '@/features/items/constants'
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

function FilterDropdown({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-card-hover"
        >
          {label}
          <ChevronDown size={14} className="text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

interface Chip {
  key: string
  label: string
  onRemove: () => void
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

  const platformById = useMemo(() => new Map(platforms.map((p) => [p.id, p.name])), [platforms])
  const genreById = useMemo(() => new Map(genres.map((g) => [g.id, g.name])), [genres])
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag.name])), [tags])

  const chips: Chip[] = [
    ...(showTypeFilter ? filters.itemTypes : []).map((type: ItemType) => ({
      key: `type:${type}`,
      label: t(ITEM_TYPE_META[type].labelKey),
      onRemove: () => setFilters({ itemTypes: filters.itemTypes.filter((v) => v !== type) }),
    })),
    ...(showPlatformFilter ? filters.platformIds : []).map((id) => ({
      key: `platform:${id}`,
      label: platformById.get(id) ?? id,
      onRemove: () => setFilters({ platformIds: filters.platformIds.filter((v) => v !== id) }),
    })),
    ...(showGenreFilter ? filters.genreIds : []).map((id) => ({
      key: `genre:${id}`,
      label: genreById.get(id) ?? id,
      onRemove: () => setFilters({ genreIds: filters.genreIds.filter((v) => v !== id) }),
    })),
    ...filters.years.map((year) => ({
      key: `year:${year}`,
      label: String(year),
      onRemove: () => setFilters({ years: filters.years.filter((v) => v !== year) }),
    })),
    ...filters.conditions.map((condition: ItemCondition) => ({
      key: `condition:${condition}`,
      label: t(CONDITION_LABEL_KEYS[condition]),
      onRemove: () => setFilters({ conditions: filters.conditions.filter((v) => v !== condition) }),
    })),
    ...filters.tagIds.map((id) => ({
      key: `tag:${id}`,
      label: tagById.get(id) ?? id,
      onRemove: () => setFilters({ tagIds: filters.tagIds.filter((v) => v !== id) }),
    })),
    ...(filters.collectionDateFrom || filters.collectionDateTo
      ? [
          {
            key: 'collectionDate',
            label: [filters.collectionDateFrom, filters.collectionDateTo].filter(Boolean).join(' – '),
            onRemove: () => setFilters({ collectionDateFrom: null, collectionDateTo: null }),
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-card-hover"
        >
          <SlidersHorizontal size={14} />
          {t('filters.title')}
          {chips.length > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-fg">
              {chips.length}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <FilterDropdown label={`${t('sort.label')}: ${t(SORT_LABEL_KEYS[filters.sort])}`}>
            {SORT_KEYS.map((key: SortKey) => (
              <DropdownMenuItem key={key} onSelect={() => setFilters({ sort: key })}>
                <span className="flex-1">{t(SORT_LABEL_KEYS[key])}</span>
                {filters.sort === key && <Check size={16} />}
              </DropdownMenuItem>
            ))}
          </FilterDropdown>

          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            <button
              type="button"
              aria-label={t('view.grid')}
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              className={`flex size-8 items-center justify-center rounded-full ${
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
              className={`flex size-8 items-center justify-center rounded-full ${
                view === 'list' ? 'bg-accent text-accent-fg' : 'text-muted hover:text-text'
              }`}
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-card-hover px-2.5 py-1 text-xs font-medium text-text"
            >
              {chip.label}
              <button type="button" onClick={chip.onRemove} aria-label={t('filters.removeChip')}>
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-accent hover:text-accent-hover"
          >
            {t('filters.clearAll')}
          </button>
        </div>
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
