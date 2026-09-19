import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { CheckIcon, CloseIcon } from '@/components/icons/ActionIcons'
import { Button, ButtonIcon } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { DatePickerField } from '@/components/ui/DatePickerField'
import { parseIsoDate } from '@/lib/isoDate'
import {
  ITEM_CONDITIONS,
  ITEM_TYPES,
  ITEM_TYPE_COLORS,
  ITEM_TYPE_META,
  CONDITION_COLORS,
  CONDITION_ICONS,
  CONDITION_LABEL_KEYS,
  DEFAULT_GENRE_META,
  FORMAT_TAG_META,
  GENRE_META,
  PLATFORM_ICONS,
} from '@/features/items/constants'
import { EditionGlyph } from '@/features/items/components/EditionBadge'
import { editionDisplayName, groupEditionNames } from '@/features/items/editions'
import type { Genre, Platform } from '@/features/items/types'
import type { Tag } from '@/features/items/api'
import { DEFAULT_FILTERS, type Filters } from '@/features/items/useFilters'
import { useLocale } from '@/hooks/useLocale'

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function CheckboxRow({
  label,
  checked,
  onChange,
  icon: Icon,
  iconColor,
  glyph,
}: {
  label: string
  checked: boolean
  onChange: () => void
  icon?: ComponentType<{ size?: number; className?: string }>
  iconColor?: string
  glyph?: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 pointer-coarse:py-3 text-sm text-text hover:bg-card-hover">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 rounded border-border accent-accent"
      />
      {glyph ?? (Icon && <Icon size={15} className={`shrink-0 ${iconColor}`} />)}
      {label}
    </label>
  )
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border py-4 first:pt-0 last:border-b-0">
      <h3 className="heading-section mb-2 text-text">{title}</h3>
      {children}
    </section>
  )
}

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: Filters
  onApply: (filters: Filters) => void
  showTypeFilter: boolean
  showPlatformFilter: boolean
  showGenreFilter: boolean
  showEditionFilter: boolean
  platforms: Platform[]
  genres: Genre[]
  tags: Tag[]
  years: number[]
  /** Distinct stored edition names present in the collection. */
  editions: string[]
}

export function FilterSheet({
  open,
  onOpenChange,
  filters,
  onApply,
  showTypeFilter,
  showPlatformFilter,
  showGenreFilter,
  showEditionFilter,
  platforms,
  genres,
  tags,
  years,
  editions,
}: FilterSheetProps) {
  const { t } = useLocale()
  const editionGroups = useMemo(() => groupEditionNames(editions), [editions])
  const [draft, setDraft] = useState<Filters>(filters)

  // Re-seed the draft from the applied filters every time the sheet opens,
  // during render rather than in an effect
  // (see https://react.dev/learn/you-might-not-need-an-effect).
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setDraft(filters)
  }

  function apply() {
    onApply(draft)
    onOpenChange(false)
  }

  function clearDraft() {
    setDraft({ ...DEFAULT_FILTERS, sort: draft.sort })
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <RadixDialog.Content className="fixed inset-0 z-50 flex flex-col bg-card text-text shadow-xl outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:w-96 sm:max-w-[90vw] sm:border-l sm:border-border">
          <div className="flex shrink-0 items-center justify-between border-b border-border p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <RadixDialog.Title className="text-lg font-semibold text-text">
              {t('filters.title')}
            </RadixDialog.Title>
            <RadixDialog.Close
              aria-label={t('search.clear')}
              className="-mr-2 flex size-10 items-center justify-center rounded-full text-muted hover:text-text"
            >
              <X size={20} />
            </RadixDialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            {showTypeFilter && (
              <FilterSection title={t('filters.itemType')}>
                <div className="flex flex-col">
                  {ITEM_TYPES.map((type) => (
                    <CheckboxRow
                      key={type}
                      label={t(ITEM_TYPE_META[type].labelKey)}
                      icon={ITEM_TYPE_META[type].icon}
                      iconColor={ITEM_TYPE_COLORS[type].icon}
                      checked={draft.itemTypes.includes(type)}
                      onChange={() => setDraft((d) => ({ ...d, itemTypes: toggleValue(d.itemTypes, type) }))}
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            {showPlatformFilter && platforms.length > 0 && (
              <FilterSection title={t('filters.platform')}>
                <div className="flex flex-col">
                  {platforms.map((platform) => (
                    <CheckboxRow
                      key={platform.id}
                      label={platform.name}
                      icon={PLATFORM_ICONS[platform.slug]}
                      iconColor="text-muted"
                      checked={draft.platformIds.includes(platform.id)}
                      onChange={() =>
                        setDraft((d) => ({ ...d, platformIds: toggleValue(d.platformIds, platform.id) }))
                      }
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            {showGenreFilter && genres.length > 0 && (
              <FilterSection title={t('filters.genre')}>
                <div className="flex flex-col">
                  {genres.map((genre) => {
                    const meta = GENRE_META[genre.slug] ?? DEFAULT_GENRE_META
                    return (
                      <CheckboxRow
                        key={genre.id}
                        label={genre.name}
                        icon={meta.icon}
                        iconColor={meta.color.icon}
                        checked={draft.genreIds.includes(genre.id)}
                        onChange={() =>
                          setDraft((d) => ({ ...d, genreIds: toggleValue(d.genreIds, genre.id) }))
                        }
                      />
                    )
                  })}
                </div>
              </FilterSection>
            )}

            {years.length > 0 && (
              <FilterSection title={t('filters.releaseYear')}>
                <div className="flex flex-col">
                  {years.map((year) => (
                    <CheckboxRow
                      key={year}
                      label={String(year)}
                      checked={draft.years.includes(year)}
                      onChange={() => setDraft((d) => ({ ...d, years: toggleValue(d.years, year) }))}
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            <FilterSection title={t('filters.condition')}>
              <div className="flex flex-col">
                {ITEM_CONDITIONS.map((condition) => (
                  <CheckboxRow
                    key={condition}
                    label={t(CONDITION_LABEL_KEYS[condition])}
                    checked={draft.conditions.includes(condition)}
                    onChange={() =>
                      setDraft((d) => ({ ...d, conditions: toggleValue(d.conditions, condition) }))
                    }
                    icon={CONDITION_ICONS[condition]}
                    iconColor={CONDITION_COLORS[condition].icon}
                  />
                ))}
              </div>
            </FilterSection>

            {tags.length > 0 && (
              <FilterSection title={t('filters.tags')}>
                <div className="flex flex-col">
                  {tags.map((tag) => {
                    const meta = FORMAT_TAG_META[tag.slug]
                    return (
                      <CheckboxRow
                        key={tag.id}
                        label={meta ? t(meta.labelKey) : tag.name}
                        icon={meta?.icon}
                        iconColor={meta?.color}
                        checked={draft.tagIds.includes(tag.id)}
                        onChange={() => setDraft((d) => ({ ...d, tagIds: toggleValue(d.tagIds, tag.id) }))}
                      />
                    )
                  })}
                </div>
              </FilterSection>
            )}

            {showEditionFilter && editionGroups.length > 0 && (
              <FilterSection title={t('filters.editions')}>
                <div className="flex flex-col">
                  {editionGroups.map((group) => (
                    <CheckboxRow
                      key={group.id}
                      label={editionDisplayName(group.name, t)}
                      glyph={<EditionGlyph edition={group.edition} size={12} />}
                      checked={group.names.some((name) => draft.editions.includes(name))}
                      onChange={() =>
                        setDraft((d) => {
                          const selected = group.names.some((name) => d.editions.includes(name))
                          return {
                            ...d,
                            editions: selected
                              ? d.editions.filter((v) => !group.names.includes(v))
                              : [...d.editions, ...group.names],
                          }
                        })
                      }
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            <FilterSection title={t('filters.collectionDate')}>
              <div className="flex items-center gap-2">
                <DatePickerField
                  ariaLabel={t('filters.collectionDateFrom')}
                  name="collectionDateFrom"
                  value={draft.collectionDateFrom ?? ''}
                  onChange={(next) => setDraft((d) => ({ ...d, collectionDateFrom: next || null }))}
                  maxDate={draft.collectionDateTo ? parseIsoDate(draft.collectionDateTo) : undefined}
                />
                <span className="text-muted">–</span>
                <DatePickerField
                  ariaLabel={t('filters.collectionDateTo')}
                  name="collectionDateTo"
                  value={draft.collectionDateTo ?? ''}
                  onChange={(next) => setDraft((d) => ({ ...d, collectionDateTo: next || null }))}
                  minDate={draft.collectionDateFrom ? parseIsoDate(draft.collectionDateFrom) : undefined}
                />
              </div>
            </FilterSection>
          </div>

          <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={clearDraft}
              className="-my-2 py-2.5 pr-2 text-sm font-semibold text-accent hover:text-accent-hover"
            >
              {t('filters.clearAll')}
            </button>
            <div className="flex items-center gap-2">
              <RadixDialog.Close className={buttonClasses({ variant: 'neutral', size: 'sm' })}>
                <ButtonIcon icon={CloseIcon} variant="neutral" size="sm" />
                {t('filters.cancel')}
              </RadixDialog.Close>
              <Button variant="primary" size="sm" icon={CheckIcon} onClick={apply}>
                {t('filters.apply')}
              </Button>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
