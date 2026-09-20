import { FORMAT_TAG_META } from '@/features/items/constants'
import type { Tag } from '@/features/items/api'
import { FieldLabel } from '@/components/ui/FieldParts'
import { useFieldIds } from '@/components/ui/useFieldIds'
import { useLocale } from '@/hooks/useLocale'

interface FormatToggleProps {
  label: string
  name: string
  /** Selected tag ids; at most one (Digital / Physical) is ever kept. */
  values: string[]
  onChange: (values: string[]) => void
  options: Tag[]
}

/** Segmented Digital / Physical switch. Clicking the active segment clears the choice. */
export function FormatToggle({ label, name, values, onChange, options }: FormatToggleProps) {
  const { t } = useLocale()
  const { labelId } = useFieldIds()
  const selectedId = options.find((option) => values.includes(option.id))?.id ?? null

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={labelId}>{label}</FieldLabel>
      <div
        role="group"
        aria-labelledby={labelId}
        data-field={name}
        className="inline-flex w-full rounded-md border border-input bg-bg p-1 sm:w-fit"
      >
        {options.map((option) => {
          const meta = FORMAT_TAG_META[option.slug]
          if (!meta) return null
          const Icon = meta.icon
          const checked = option.id === selectedId
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={checked}
              onClick={() => onChange(checked ? [] : [option.id])}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none ${
                checked ? 'bg-card-hover text-text shadow-sm' : 'text-muted hover:text-text'
              }`}
            >
              <Icon size={15} className={checked ? meta.color : ''} />
              {t(meta.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
