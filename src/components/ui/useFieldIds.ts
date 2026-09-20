import { useId } from 'react'

/** Ids that tie a field's visible label and error message to its control. */
export function useFieldIds() {
  const base = useId()
  return { labelId: `${base}-label`, errorId: `${base}-error`, controlId: `${base}-control` }
}

/**
 * ARIA attributes for a button-style trigger (custom select, date picker) that shows the
 * current value as its own text: its name is "<label> <value>" and the error is its description.
 */
export function triggerA11yProps({
  labelId,
  controlId,
  errorId,
  error,
  required,
}: {
  labelId: string
  controlId: string
  errorId: string
  error?: string
  required?: boolean
}) {
  return {
    id: controlId,
    'aria-labelledby': `${labelId} ${controlId}`,
    'aria-describedby': error ? errorId : undefined,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-required': required ? (true as const) : undefined,
  }
}
