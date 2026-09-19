import { Star } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

export interface MultiSelectOption {
  id: string
  name: string
}

interface MultiSelectProps {
  label: string
  name: string
  values: string[]
  onChange: (values: string[]) => void
  options: MultiSelectOption[]
  emptyLabel?: string
  /** Shows a star toggle on each selected chip to mark it "primary" — moves that option to the front of `values`. */
  primary?: boolean
}

export function MultiSelect({ label, name, values, onChange, options, emptyLabel, primary = false }: MultiSelectProps) {
  const { t } = useLocale()

  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id])
  }

  function setAsPrimary(id: string) {
    onChange([id, ...values.filter((v) => v !== id)])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label font-semibold text-text">{label}</span>
      {options.length === 0 ? (
        <p className="text-xs text-muted">{emptyLabel}</p>
      ) : (
        <div data-field={name} className="flex flex-wrap gap-2 rounded-md border border-border bg-bg p-2">
          {options.map((option) => {
            const checked = values.includes(option.id)
            const isPrimary = primary && checked && values[0] === option.id
            return (
              <span
                key={option.id}
                className={`relative flex items-center gap-1 rounded-full border pl-2.5 pr-2.5 py-1 text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-accent/50 ${
                  checked
                    ? 'border-accent bg-accent text-accent-fg'
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
                    className="-ml-0.5 flex items-center"
                  >
                    <Star size={12} className={isPrimary ? 'fill-current' : 'opacity-50'} />
                  </button>
                )}
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" checked={checked} onChange={() => toggle(option.id)} className="sr-only" />
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
