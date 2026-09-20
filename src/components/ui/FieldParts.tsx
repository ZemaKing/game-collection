import type { ReactNode } from 'react'

interface FieldLabelProps {
  id?: string
  required?: boolean
  children: ReactNode
}

/**
 * Visible field caption. The required asterisk is decoration only — the control itself
 * carries `aria-required`, so screen readers don't announce a stray "star".
 */
export function FieldLabel({ id, required, children }: FieldLabelProps) {
  return (
    <span id={id} className="text-label font-semibold text-text">
      {children}
      {required && (
        <span aria-hidden="true" className="text-danger">
          {' '}
          *
        </span>
      )}
    </span>
  )
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className="text-xs text-danger">
      {children}
    </span>
  )
}
