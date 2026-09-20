import { Star, type LucideIcon } from 'lucide-react'
import { FieldLabel } from '@/components/ui/FieldParts'
import { useFieldIds } from '@/components/ui/useFieldIds'
import { useLocale } from '@/hooks/useLocale'

export interface MultiSelectOption {
  id: string
  name: string
}

/** Per-option decoration: a glyph shown on every chip, and a `text-*` class that tints icon, text and border once selected. */
export interface MultiSelectOptionMeta {
  icon: LucideIcon
  colorClass: string
}

interface MultiSelectProps<T extends MultiSelectOption> {
  label: string
  name: string
  values: string[]
  onChange: (values: string[]) => void
  options: T[]
  emptyLabel?: string
  /** Shows a star toggle on each selected chip to mark it "primary" — moves that option to the front of `values`. */
  primary?: boolean
  optionMeta?: (option: T) => MultiSelectOptionMeta
}

export function MultiSelect<T extends MultiSelectOption>({
  label,
  name,
  values,
  onChange,
  options,
  emptyLabel,
  primary = false,
  optionMeta,
}: MultiSelectProps<T>) {
  const { t } = useLocale()
  const { labelId } = useFieldIds()

  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id])
  }

  function setAsPrimary(id: string) {
    onChange([id, ...values.filter((v) => v !== id)])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={labelId}>{label}</FieldLabel>
      {options.length === 0 ? (
        <p className="text-xs text-muted">{emptyLabel}</p>
      ) : (
        <div
          role="group"
          aria-labelledby={labelId}
          data-field={name}
          className="flex flex-wrap gap-2 rounded-md border border-input bg-bg p-2"
        >
          {options.map((option) => {
            const checked = values.includes(option.id)
            const isPrimary = primary && checked && values[0] === option.id
            const meta = optionMeta?.(option)
            const Icon = meta?.icon
            return (
              <span
                key={option.id}
                className={`relative flex items-center gap-1 rounded-full border pl-2.5 pr-2.5 py-1 pointer-coarse:py-2.5 text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-accent ${
                  meta
                    ? checked
                      ? `${meta.colorClass} border-current bg-card-hover`
                      : 'border-border text-text hover:bg-card-hover'
                    : checked
                      ? 'border-accent bg-accent-solid text-accent-fg'
                      : 'border-border text-text hover:bg-card-hover'
                }`}
              >
                {primary && checked && (
                  <button
                    type="button"
                    onClick={() => setAsPrimary(option.id)}
                    aria-label={isPrimary ? t('form.primaryGenre') : t('form.setPrimaryGenre')}
                    aria-pressed={isPrimary}
                    title={isPrimary ? t('form.primaryGenre') : t('form.setPrimaryGenre')}
                    className="-my-2 -ml-2.5 flex items-center p-2 pl-2.5"
                  >
                    <Star size={12} className={isPrimary ? 'fill-current' : 'opacity-50'} />
                  </button>
                )}
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" checked={checked} onChange={() => toggle(option.id)} className="sr-only" />
                  {Icon && <Icon size={14} aria-hidden="true" />}
                  {option.name}
                </label>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
