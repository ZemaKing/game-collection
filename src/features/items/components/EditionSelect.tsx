import { Check, ChevronDown, Search } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover'
import {
  EditionBadge,
  EditionGlyph,
} from '@/features/items/components/EditionBadge'
import {
  EDITIONS,
  resolveEdition,
  type EditionDef,
} from '@/features/items/editions'
import { useLocale } from '@/hooks/useLocale'

interface EditionSelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  error?: string
}

type Option =
  | { kind: 'none' }
  | { kind: 'edition'; edition: EditionDef; text: string }
  | { kind: 'custom'; text: string }

/**
 * Searchable edition picker. Picking one of the 12 editions stores its
 * canonical English name; typing something else offers it as a free-text
 * value, since `edition_name` is a plain text column (e.g. "Collector's").
 */
export function EditionSelect({
  label,
  name,
  value,
  onChange,
  error,
}: EditionSelectProps) {
  const { t } = useLocale()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedEdition = resolveEdition(value)
  const trimmedQuery = query.trim()

  const options = useMemo<Option[]>(() => {
    const needle = trimmedQuery.toLowerCase()
    const matches: Option[] = EDITIONS.map((edition) => ({
      kind: 'edition' as const,
      edition,
      text: `${t(edition.nameKey)} ${t('edition.suffix')}`,
    })).filter(
      (option) =>
        !needle ||
        option.text.toLowerCase().includes(needle) ||
        option.edition.canonicalName.toLowerCase().includes(needle),
    )
    const result: Option[] = []
    if (value && !needle) result.push({ kind: 'none' })
    result.push(...matches)
    if (needle && !resolveEdition(trimmedQuery))
      result.push({ kind: 'custom', text: trimmedQuery })
    return result
  }, [trimmedQuery, value, t])

  // Keep the highlighted row in range and scrolled into view as the list changes / arrows move.
  const activeOption = options[Math.min(activeIndex, options.length - 1)]
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, options])

  function openChanged(next: boolean) {
    setOpen(next)
    if (next) {
      setQuery('')
      const current = selectedEdition
        ? EDITIONS.indexOf(selectedEdition) + (value ? 1 : 0)
        : 0
      setActiveIndex(Math.max(current, 0))
    }
  }

  function commit(option: Option | undefined) {
    if (!option) return
    if (option.kind === 'none') onChange('')
    else if (option.kind === 'edition') onChange(option.edition.canonicalName)
    else onChange(option.text)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(options.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault() // don't submit the surrounding form
      commit(activeOption)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label font-semibold text-text">{label}</span>
      <Popover open={open} onOpenChange={openChanged}>
        <PopoverTrigger asChild>
          <button
            type="button"
            name={name}
            data-field={name}
            aria-invalid={error ? true : undefined}
            aria-haspopup="listbox"
            className={`flex min-h-[38px] items-center justify-between gap-2 rounded-md border bg-bg px-2 py-1.5 text-left text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : 'border-border'}`}
          >
            <span className="flex min-w-0 flex-1 items-center">
              {value ? (
                <EditionBadge name={value} />
              ) : (
                <span className="px-1 text-muted">—</span>
              )}
            </span>
            <ChevronDown size={16} className="shrink-0 text-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-64 p-1"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <div className="relative mb-1">
            <Search
              size={14}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted"
            />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={
                activeOption
                  ? `${listId}-${Math.min(activeIndex, options.length - 1)}`
                  : undefined
              }
              aria-label={t('edition.searchPlaceholder')}
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={t('edition.searchPlaceholder')}
              className="w-full rounded-md border border-border bg-bg py-1.5 pr-2 pl-8 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-64 overflow-y-auto"
          >
            {options.length === 0 && (
              <li className="px-2 py-2 text-sm text-muted">
                {t('edition.noMatch')}
              </li>
            )}
            {options.map((option, index) => {
              const active = index === Math.min(activeIndex, options.length - 1)
              const edition = option.kind === 'edition' ? option.edition : null
              const selected =
                option.kind === 'edition'
                  ? option.edition === selectedEdition
                  : option.kind === 'custom'
                    ? option.text === value
                    : false
              return (
                <li
                  key={
                    option.kind === 'edition' ? option.edition.key : option.kind
                  }
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  data-active={active}
                  data-edition={edition?.key ?? 'custom'}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => commit(option)}
                  className="edition-scope edition-option flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                >
                  {option.kind === 'none' ? (
                    <span className="px-1 text-muted">{t('edition.none')}</span>
                  ) : (
                    <>
                      <EditionGlyph edition={edition} size={14} />
                      <span className="min-w-0 flex-1 truncate">
                        {option.kind === 'edition'
                          ? option.text
                          : t('edition.useCustom', { name: option.text })}
                      </span>
                      {selected && (
                        <Check
                          size={16}
                          className="shrink-0 text-[var(--ed)]"
                        />
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </PopoverContent>
      </Popover>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
