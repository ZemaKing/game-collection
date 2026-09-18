import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label: string
  name: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, name, error, required, className = '', ...props },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label font-semibold text-text">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <input
        ref={ref}
        name={name}
        data-field={name}
        aria-invalid={error ? true : undefined}
        className={`rounded-md border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : 'border-border'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  )
})
