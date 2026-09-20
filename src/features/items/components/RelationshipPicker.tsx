import { useState } from 'react'
import { ITEM_TYPE_META } from '@/features/items/constants'
import type { RelatedItemRef } from '@/features/items/forms/useSaveItem'
import type { AllItemRow, ItemType } from '@/features/items/types'
import { useSearch } from '@/features/search/useSearch'
import { FieldLabel } from '@/components/ui/FieldParts'
import { useFieldIds } from '@/components/ui/useFieldIds'
import { useLocale } from '@/hooks/useLocale'

export type RelatedItemSelection = RelatedItemRef & { title: string }

interface RelationshipPickerProps {
  label: string
  selected: RelatedItemSelection[]
  onChange: (next: RelatedItemSelection[]) => void
  /** Excludes the item being edited from its own search results. */
  excludeId?: string
  /** Extra ids to hide from results (e.g. items already chosen in a sibling picker). */
  excludeIds?: string[]
  /** Restricts results to these item types (e.g. only games for a special edition's base game). */
  allowedTypes?: ItemType[]
}

/**
 * Search-and-attach picker for `item_relationships`. Reuses the existing
 * debounced/stale-safe `useSearch` (built for Global Search, Phase 10) and
 * `searchItems`'s normalized title/subtitle/platform/genre/tag match — no
 * new search query needed.
 */
export function RelationshipPicker({
  label,
  selected,
  onChange,
  excludeId,
  excludeIds = [],
  allowedTypes,
}: RelationshipPickerProps) {
  const { t } = useLocale()
  const { labelId } = useFieldIds()
  const [query, setQuery] = useState('')
  const { results, loading } = useSearch(query)

  const hiddenIds = new Set([...selected.map((item) => item.itemId), ...excludeIds])
  const candidates = results.filter(
    (row) =>
      row.id !== excludeId && !hiddenIds.has(row.id) && (!allowedTypes || allowedTypes.includes(row.item_type)),
  )

  function add(row: AllItemRow) {
    onChange([...selected, { itemType: row.item_type, itemId: row.id, title: row.title }])
    setQuery('')
  }

  function remove(itemId: string) {
    onChange(selected.filter((item) => item.itemId !== itemId))
  }

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel id={labelId}>{label}</FieldLabel>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((item) => {
            const Icon = ITEM_TYPE_META[item.itemType].icon
            return (
              <li
                key={item.itemId}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card-hover px-2.5 py-1 text-xs font-medium text-text"
              >
                <Icon size={12} className="text-muted" />
                {item.title}
                <button
                  type="button"
                  onClick={() => remove(item.itemId)}
                  aria-label={`${t('form.removeRelatedItem')}: ${item.title}`}
                  className="px-1 text-muted hover:text-text pointer-coarse:px-2.5 pointer-coarse:py-1"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <input
        aria-labelledby={labelId}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('form.relationshipSearchPlaceholder')}
        className="rounded-md border border-input bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />

      {query.trim() !== '' && (
        <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-card">
          {loading ? (
            <p role="status" className="px-3 py-2 text-xs text-muted">{t('listing.loading')}</p>
          ) : candidates.length === 0 ? (
            <p role="status" className="px-3 py-2 text-xs text-muted">{t('search.noResults', { query })}</p>
          ) : (
            candidates.map((row) => {
              const Icon = ITEM_TYPE_META[row.item_type].icon
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => add(row)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-card-hover"
                >
                  <Icon size={14} className="shrink-0 text-muted" />
                  <span className="truncate">{row.title}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
