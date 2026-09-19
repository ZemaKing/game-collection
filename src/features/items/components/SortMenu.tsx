import { Calendar, Check, ChevronDown, Clock, RefreshCw, Type as TypeIcon, type LucideIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { SORT_KEYS, type SortKey } from '@/features/items/sort'
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

interface SortMenuProps {
  value: SortKey
  onChange: (value: SortKey) => void
  /** Lets an external `<label htmlFor>` name the trigger button. */
  id?: string
  /** Extra classes for the trigger, e.g. a fixed width. */
  className?: string
}

/** The sort dropdown (icon + label per option, check on the current one), shared by the listing toolbar and Settings. */
export function SortMenu({ value, onChange, id, className = '' }: SortMenuProps) {
  const { t } = useLocale()
  const CurrentIcon = SORT_ICONS[value]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id={id}
          type="button"
          className={`flex items-center gap-2 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm font-semibold text-text hover:bg-card-hover ${className}`}
        >
          <CurrentIcon size={16} className="shrink-0 text-muted" />
          <span className="flex-1 text-left">{t(SORT_LABEL_KEYS[value])}</span>
          <ChevronDown size={16} className="text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {SORT_KEYS.map((key) => {
          const SortIcon = SORT_ICONS[key]
          return (
            <DropdownMenuItem key={key} onSelect={() => onChange(key)}>
              <SortIcon size={15} className="shrink-0 text-muted" />
              <span className="flex-1">{t(SORT_LABEL_KEYS[key])}</span>
              {value === key && <Check size={16} />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
