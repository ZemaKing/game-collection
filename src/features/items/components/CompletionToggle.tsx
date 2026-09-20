import { Circle, CircleCheck } from 'lucide-react'
import { FieldLabel } from '@/components/ui/FieldParts'
import { useFieldIds } from '@/components/ui/useFieldIds'
import { useLocale } from '@/hooks/useLocale'

interface CompletionToggleProps {
  label: string
  name: string
  value: boolean
  onChange: (value: boolean) => void
}

/** Segmented Not Completed / Completed switch — same design as `FormatToggle` (the Tags control). */
export function CompletionToggle({ label, name, value, onChange }: CompletionToggleProps) {
  const { t } = useLocale()
  const { labelId } = useFieldIds()
  const options = [
    { completed: false, labelKey: 'completed.no', icon: Circle, color: '' },
    { completed: true, labelKey: 'completed.yes', icon: CircleCheck, color: 'text-success' },
  ] as const

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
          const checked = option.completed === value
          const Icon = option.icon
          return (
            <button
              key={option.labelKey}
              type="button"
              aria-pressed={checked}
              onClick={() => onChange(option.completed)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none ${
                checked ? 'bg-card-hover text-text shadow-sm' : 'text-muted hover:text-text'
              }`}
            >
              <Icon size={15} className={checked ? option.color : ''} />
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
