import { Search, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import {
  ITEM_TYPES,
  ITEM_TYPE_META,
  ITEM_TYPE_ROUTES,
} from '@/features/items/constants'
import { COMPLETED_TEXT_CLASS, CompletedCheck } from '@/features/items/components/CompletedMarks'
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

function groupByType(
  results: AllItemRow[],
): { type: ItemType; items: AllItemRow[] }[] {
  return ITEM_TYPES.map((type) => ({
    type,
    items: results.filter((r) => r.item_type === type),
  })).filter((group) => group.items.length > 0)
}

interface SearchPanelProps {
  onNavigate?: () => void
  autoFocus?: boolean
}

export function SearchPanel({
  onNavigate,
  autoFocus = false,
}: SearchPanelProps) {
  const { t } = useLocale()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const { results, loading, error, reload } = useSearch(query)
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
  const showResults = trimmed !== '' && !error && orderedResults.length > 0
  const optionId = (index: number) => `${listboxId}-option-${index}`

  // One polite live message for the outcome of the current query, so screen-reader users hear
  // that results arrived (or that there were none) without leaving the input.
  const statusMessage =
    !trimmed || error
      ? ''
      : loading
        ? t('listing.loading')
        : orderedResults.length === 0
          ? t('search.noResults', { query: trimmed })
          : t('a11y.resultsCount', { count: String(orderedResults.length) })

  // The highlighted option is tracked with aria-activedescendant (focus stays in the input),
  // so nothing scrolls it into view natively.
  useEffect(() => {
    if (showResults) {
      document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' })
    }
    // optionId is derived from listboxId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, showResults])

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
          role="combobox"
          aria-label={t('search.dialogTitle')}
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={showResults ? listboxId : undefined}
          aria-activedescendant={
            showResults ? optionId(activeIndex) : undefined
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('topbar.searchPlaceholder')}
          className="w-full rounded-full border border-input bg-bg py-2.5 pr-9 pl-9 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:appearance-none"
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

      <p role="status" className="sr-only">
        {statusMessage}
      </p>

      <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
        {!trimmed && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="heading-section text-text">
                {t('search.recentSearches')}
              </h2>
              {recent.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-sm font-semibold text-accent hover:text-accent-hover"
                >
                  {t('search.clearAll')}
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <EmptyState compact body={t('search.emptyRecent')} />
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
                      aria-label={t('a11y.removeNamed', {
                        action: t('search.removeRecent'),
                        name: entry,
                      })}
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
          <ErrorState
            message={t('listing.error', { message: error })}
            onRetry={reload}
          />
        )}

        {trimmed && !error && loading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {trimmed && !error && !loading && orderedResults.length === 0 && (
          <EmptyState
            compact
            body={t('search.noResults', { query: trimmed })}
          />
        )}

        {showResults && (
          <div
            role="listbox"
            id={listboxId}
            aria-label={t('search.dialogTitle')}
            className="flex flex-col gap-4"
          >
            {groups.map((group) => {
              const Icon = ITEM_TYPE_META[group.type].icon
              return (
                <div
                  key={group.type}
                  role="group"
                  aria-labelledby={`${listboxId}-${group.type}`}
                  className="flex flex-col gap-1"
                >
                  <h2
                    id={`${listboxId}-${group.type}`}
                    className="heading-section mb-1 text-text"
                  >
                    {t(ITEM_TYPE_META[group.type].labelKey)}
                  </h2>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const index = orderedResults.indexOf(item)
                      const isActive = index === activeIndex
                      return (
                        <button
                          key={item.id}
                          id={optionId(index)}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          tabIndex={-1}
                          onClick={() => selectResult(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left ${
                            isActive ? 'bg-card-hover ring-2 ring-inset ring-accent' : 'hover:bg-card-hover'
                          }`}
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card-hover text-muted">
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`flex items-center gap-1.5 text-sm font-semibold ${item.completed ? COMPLETED_TEXT_CLASS : 'text-text'}`}>
                              {item.completed && <CompletedCheck />}
                              <span className="truncate">
                                <HighlightMatch
                                  text={item.title}
                                  query={trimmed}
                                />
                              </span>
                            </p>
                            {item.subtitle && (
                              <p className="truncate text-xs text-muted">
                                <HighlightMatch
                                  text={item.subtitle}
                                  query={trimmed}
                                />
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
