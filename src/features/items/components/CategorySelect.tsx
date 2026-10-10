import { Check, ChevronDown, Search } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { FieldError, FieldLabel } from '@/components/ui/FieldParts'
import { triggerA11yProps, useFieldIds } from '@/components/ui/useFieldIds'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover'
import {
  STUFF_CATEGORIES,
  stuffCategoryMeta,
} from '@/features/items/constants'
import { useLocale } from '@/hooks/useLocale'

interface CategorySelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  error?: string
}

type Option =
  | { kind: 'none' }
  | { kind: 'category'; name: string }
  | { kind: 'custom'; name: string }

function isKnown(name: string) {
  const key = name.trim().toLowerCase()
  return STUFF_CATEGORIES.some((c) => c.name.toLowerCase() === key)
}

/** The category pill — same design as on the detail page and Stuff cards. */
export function CategoryPill({ name }: { name: string }) {
  const meta = stuffCategoryMeta(name)
  const Icon = meta.icon
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.color.badge}`}
    >
      <Icon size={13} className="shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  )
}

function CategoryGlyph({ name }: { name: string }) {
  const meta = stuffCategoryMeta(name)
  const Icon = meta.icon
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${meta.color.badge}`}
    >
      <Icon size={14} />
    </span>
  )
}

/**
 * Searchable Stuff category picker. Picking a known category stores its
 * canonical name; typing something else offers it as a free-text value,
 * since `stuff.category` is a plain text column (same as `EditionSelect`).
 */
export function CategorySelect({
  label,
  name,
  value,
  onChange,
  error,
}: CategorySelectProps) {
  const { t } = useLocale()
  const listId = useId()
  const ids = useFieldIds()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const trimmedQuery = query.trim()
  const selectedKey = value.trim().toLowerCase()

  const options = useMemo<Option[]>(() => {
    const needle = trimmedQuery.toLowerCase()
    const result: Option[] = []
    if (value && !needle) result.push({ kind: 'none' })
    // A stored value that isn't a known category stays pickable.
    if (value && !needle && !isKnown(value))
      result.push({ kind: 'custom', name: value })
    result.push(
      ...STUFF_CATEGORIES.filter(
        (c) => !needle || c.name.toLowerCase().includes(needle),
      ).map((c) => ({ kind: 'category' as const, name: c.name })),
    )
    if (needle && !isKnown(trimmedQuery))
      result.push({ kind: 'custom', name: trimmedQuery })
    return result
  }, [trimmedQuery, value])

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
      const current = options.findIndex(
        (option) =>
          option.kind !== 'none' && option.name.toLowerCase() === selectedKey,
      )
      setActiveIndex(Math.max(current, 0))
    }
  }

  function commit(option: Option | undefined) {
    if (!option) return
    onChange(option.kind === 'none' ? '' : option.name)
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
      <FieldLabel id={ids.labelId}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={openChanged}>
        <PopoverTrigger asChild>
          <button
            type="button"
            name={name}
            data-field={name}
            {...triggerA11yProps({ ...ids, error })}
            aria-haspopup="listbox"
            className={`flex min-h-[38px] items-center justify-between gap-2 rounded-md border bg-bg px-2 py-1.5 text-left text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : 'border-input'}`}
          >
            <span className="flex min-w-0 flex-1 items-center">
              {value ? (
                <CategoryPill name={value} />
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
              aria-label={t('category.searchPlaceholder')}
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={t('category.searchPlaceholder')}
              className="w-full rounded-md border border-input bg-bg py-1.5 pr-2 pl-8 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
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
                {t('category.noMatch')}
              </li>
            )}
            {options.map((option, index) => {
              const active = index === Math.min(activeIndex, options.length - 1)
              const selected =
                option.kind !== 'none' &&
                option.name.toLowerCase() === selectedKey
              return (
                <li
                  key={option.kind === 'none' ? 'none' : `${option.kind}-${option.name}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  data-active={active}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => commit(option)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm ${active ? 'bg-card-hover' : ''}`}
                >
                  {option.kind === 'none' ? (
                    <span className="px-1 text-muted">{t('category.none')}</span>
                  ) : (
                    <>
                      <CategoryGlyph name={option.name} />
                      <span className="min-w-0 flex-1 truncate">
                        {option.kind === 'custom' && option.name !== value
                          ? t('category.useCustom', { name: option.name })
                          : option.name}
                      </span>
                      {selected && (
                        <Check size={16} className="shrink-0 text-accent" />
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </PopoverContent>
      </Popover>
      {error && <FieldError id={ids.errorId}>{error}</FieldError>}
    </div>
  )
}
