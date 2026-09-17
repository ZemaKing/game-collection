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
}

export function MultiSelect({ label, name, values, onChange, options, emptyLabel }: MultiSelectProps) {
  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id])
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-text">{label}</span>
      {options.length === 0 ? (
        <p className="text-xs text-muted">{emptyLabel}</p>
      ) : (
        <div data-field={name} className="flex flex-wrap gap-2 rounded-md border border-border bg-bg p-2">
          {options.map((option) => {
            const checked = values.includes(option.id)
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  checked
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-border text-text hover:bg-card-hover'
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(option.id)} className="sr-only" />
                {option.name}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
