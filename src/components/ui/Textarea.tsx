import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { FieldError, FieldLabel } from '@/components/ui/FieldParts'
import { useFieldIds } from '@/components/ui/useFieldIds'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  label: string
  name: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, name, error, required, className = '', rows = 3, ...props },
  ref,
) {
  const { errorId } = useFieldIds()
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        ref={ref}
        name={name}
        data-field={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={error ? errorId : undefined}
        className={`resize-none rounded-md border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : 'border-input'} ${className}`}
        {...props}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </label>
  )
})
