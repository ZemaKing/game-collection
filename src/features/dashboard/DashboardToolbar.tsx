import { Check, ChevronDown, LayoutGrid, List as ListIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { SORT_KEYS, type SortKey } from '@/features/items/api'
import { ITEM_TYPES, ITEM_TYPE_META } from '@/features/items/constants'
import type { DashboardPrefs } from '@/features/dashboard/useDashboardPrefs'
import type { Platform, ItemStatus } from '@/features/items/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useLocale } from '@/hooks/useLocale'
import type { TranslationKey } from '@/lib/i18n'

const STATUS_LABEL_KEYS: Record<ItemStatus | 'all', TranslationKey> = {
  owned: 'status.owned',
  wishlist: 'status.wishlist',
  all: 'status.all',
}

const SORT_LABEL_KEYS: Record<SortKey, TranslationKey> = {
  recently_added: 'sort.recently_added',
  title: 'sort.title',
  release_date: 'sort.release_date',
  value: 'sort.value',
  last_updated: 'sort.last_updated',
}

function FilterDropdown({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
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
      <DropdownMenuContent align="start">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

interface DashboardToolbarProps {
  platforms: Platform[]
  prefs: DashboardPrefs
  setPrefs: (partial: Partial<DashboardPrefs>) => void
}

export function DashboardToolbar({ platforms, prefs, setPrefs }: DashboardToolbarProps) {
  const { t } = useLocale()

  const platformLabel =
    prefs.platformId === 'all'
      ? t('filter.allPlatforms')
      : (platforms.find((p) => p.id === prefs.platformId)?.name ?? t('filter.allPlatforms'))

  const typeLabel =
    prefs.itemType === 'all' ? t('filter.allTypes') : t(ITEM_TYPE_META[prefs.itemType].labelKey)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDropdown label={platformLabel}>
        <DropdownMenuItem onSelect={() => setPrefs({ platformId: 'all' })}>
          <span className="flex-1">{t('filter.allPlatforms')}</span>
          {prefs.platformId === 'all' && <Check size={16} />}
        </DropdownMenuItem>
        {platforms.map((platform) => (
          <DropdownMenuItem key={platform.id} onSelect={() => setPrefs({ platformId: platform.id })}>
            <span className="flex-1">{platform.name}</span>
            {prefs.platformId === platform.id && <Check size={16} />}
          </DropdownMenuItem>
        ))}
      </FilterDropdown>

      <FilterDropdown label={typeLabel}>
        <DropdownMenuItem onSelect={() => setPrefs({ itemType: 'all' })}>
          <span className="flex-1">{t('filter.allTypes')}</span>
          {prefs.itemType === 'all' && <Check size={16} />}
        </DropdownMenuItem>
        {ITEM_TYPES.map((type) => (
          <DropdownMenuItem key={type} onSelect={() => setPrefs({ itemType: type })}>
            <span className="flex-1">{t(ITEM_TYPE_META[type].labelKey)}</span>
            {prefs.itemType === type && <Check size={16} />}
          </DropdownMenuItem>
        ))}
      </FilterDropdown>

      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
        {(['owned', 'wishlist', 'all'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setPrefs({ status })}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              prefs.status === status
                ? 'bg-accent text-accent-fg'
                : 'text-muted hover:text-text'
            }`}
          >
            {t(STATUS_LABEL_KEYS[status])}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <FilterDropdown label={`${t('sort.label')}: ${t(SORT_LABEL_KEYS[prefs.sort])}`}>
          {SORT_KEYS.map((key: SortKey) => (
            <DropdownMenuItem key={key} onSelect={() => setPrefs({ sort: key })}>
              <span className="flex-1">{t(SORT_LABEL_KEYS[key])}</span>
              {prefs.sort === key && <Check size={16} />}
            </DropdownMenuItem>
          ))}
        </FilterDropdown>

        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            aria-label={t('view.grid')}
            aria-pressed={prefs.view === 'grid'}
            onClick={() => setPrefs({ view: 'grid' })}
            className={`flex size-8 items-center justify-center rounded-full ${
              prefs.view === 'grid' ? 'bg-accent text-accent-fg' : 'text-muted hover:text-text'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            aria-label={t('view.list')}
            aria-pressed={prefs.view === 'list'}
            onClick={() => setPrefs({ view: 'list' })}
            className={`flex size-8 items-center justify-center rounded-full ${
              prefs.view === 'list' ? 'bg-accent text-accent-fg' : 'text-muted hover:text-text'
            }`}
          >
            <ListIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
