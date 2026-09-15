import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ITEM_TYPES, ITEM_TYPE_META, ITEM_TYPE_ROUTES } from '@/features/items/constants'
import type { AllItemRow, ItemType } from '@/features/items/types'
import { useRecentSearches } from '@/features/search/useRecentSearches'
import { useSearch } from '@/features/search/useSearch'
import { useLocale } from '@/hooks/useLocale'

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-accent/25 text-inherit">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function groupByType(results: AllItemRow[]): { type: ItemType; items: AllItemRow[] }[] {
  return ITEM_TYPES.map((type) => ({ type, items: results.filter((r) => r.item_type === type) })).filter(
    (group) => group.items.length > 0,
  )
}

interface SearchPanelProps {
  onNavigate?: () => void
  autoFocus?: boolean
}

export function SearchPanel({ onNavigate, autoFocus = false }: SearchPanelProps) {
  const { t } = useLocale()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const { results, loading, error } = useSearch(query)
  const { recent, addRecent, removeRecent, clearRecent } = useRecentSearches()

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Reset the keyboard-nav selection whenever the result set changes, during
  // render rather than in an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  const [lastResults, setLastResults] = useState(results)
  if (results !== lastResults) {
    setLastResults(results)
    setActiveIndex(0)
  }

  const groups = useMemo(() => groupByType(results), [results])
  const orderedResults = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const trimmed = query.trim()

  function selectResult(item: AllItemRow) {
    addRecent(trimmed)
    navigate(`/${ITEM_TYPE_ROUTES[item.item_type]}/${item.id}`)
    onNavigate?.()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, orderedResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = orderedResults[activeIndex]
      if (item) selectResult(item)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative shrink-0 p-4 pb-0">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-7 -translate-y-1/2 text-muted"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('topbar.searchPlaceholder')}
          className="w-full rounded-full border border-border bg-bg py-2.5 pr-9 pl-9 text-sm text-text placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <button
            type="button"
            aria-label={t('search.clear')}
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-7 -translate-y-1/2 text-muted hover:text-text"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
        {!trimmed && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">{t('search.recentSearches')}</h2>
              {recent.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-sm font-medium text-accent hover:text-accent-hover"
                >
                  {t('search.clearAll')}
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {recent.map((entry) => (
                  <li key={entry} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuery(entry)}
                      className="flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm text-text hover:bg-card-hover"
                    >
                      {entry}
                    </button>
                    <button
                      type="button"
                      aria-label={t('search.removeRecent')}
                      onClick={() => removeRecent(entry)}
                      className="shrink-0 rounded-md p-1.5 text-muted hover:bg-card-hover hover:text-text"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {trimmed && error && (
          <p className="rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
            {t('listing.error', { message: error })}
          </p>
        )}

        {trimmed && !error && loading && (
          <p className="text-center text-sm text-muted">{t('listing.loading')}</p>
        )}

        {trimmed && !error && !loading && orderedResults.length === 0 && (
          <p className="text-center text-sm text-muted">{t('search.noResults', { query: trimmed })}</p>
        )}

        {trimmed &&
          !error &&
          groups.map((group) => {
            const Icon = ITEM_TYPE_META[group.type].icon
            return (
              <section key={group.type}>
                <h2 className="mb-2 text-sm font-semibold text-text">
                  {t(ITEM_TYPE_META[group.type].labelKey)}
                </h2>
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const index = orderedResults.indexOf(item)
                    const isActive = index === activeIndex
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => selectResult(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left ${
                            isActive ? 'bg-card-hover' : 'hover:bg-card-hover'
                          }`}
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card-hover text-muted">
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text">
                              <HighlightMatch text={item.title} query={trimmed} />
                            </p>
                            {item.subtitle && (
                              <p className="truncate text-xs text-muted">
                                <HighlightMatch text={item.subtitle} query={trimmed} />
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
      </div>
    </div>
  )
}
