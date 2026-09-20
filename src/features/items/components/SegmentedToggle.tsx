import type { LucideIcon } from 'lucide-react'
import { FieldLabel } from '@/components/ui/FieldParts'
import { useFieldIds } from '@/components/ui/useFieldIds'

export interface SegmentedOption<V extends string> {
  value: V
  label: string
  icon: LucideIcon
  /** Colour class for the icon while this segment is selected. */
  iconClass?: string
}

interface SegmentedToggleProps<V extends string> {
  label: string
  name: string
  value: V
  onChange: (value: V) => void
  options: SegmentedOption<V>[]
}

/** Exclusive segmented switch — the same design as `FormatToggle` (the Tags control), for a fixed set of options. */
export function SegmentedToggle<V extends string>({ label, name, value, onChange, options }: SegmentedToggleProps<V>) {
  const { labelId } = useFieldIds()

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
          const checked = option.value === value
          const Icon = option.icon
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={checked}
              onClick={() => onChange(option.value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none ${
                checked ? 'bg-card-hover text-text shadow-sm' : 'text-muted hover:text-text'
              }`}
            >
              <Icon size={15} className={checked ? option.iconClass : ''} />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
