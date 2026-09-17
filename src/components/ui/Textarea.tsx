import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  label: string
  name: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, name, error, required, className = '', rows = 3, ...props },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-text">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <textarea
        ref={ref}
        name={name}
        data-field={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={`resize-none rounded-md border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : 'border-border'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  )
})
