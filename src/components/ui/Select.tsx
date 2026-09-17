export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: string
  required?: boolean
}

export function Select({ label, name, value, onChange, options, placeholder, error, required }: SelectProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-text">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <select
        name={name}
        data-field={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`rounded-md border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : 'border-border'}`}
      >
        <option value="">{placeholder ?? ''}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  )
}
