import type { ReactNode } from 'react'
import { useLocale } from '@/hooks/useLocale'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  /** Extra action rendered alongside Retry, e.g. a "Sign in again" link. */
  secondaryAction?: ReactNode
}

/** Inline danger banner for a failed fetch/mutation, with an optional retry action. */
export function ErrorState({ message, onRetry, secondaryAction }: ErrorStateProps) {
  const { t } = useLocale()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
      <span>{message}</span>
      {(onRetry || secondaryAction) && (
        <span className="flex shrink-0 items-center gap-3">
          {onRetry && (
            <button type="button" onClick={onRetry} className="font-semibold hover:underline">
              {t('common.retry')}
            </button>
          )}
          {secondaryAction}
        </span>
      )}
    </div>
  )
}
