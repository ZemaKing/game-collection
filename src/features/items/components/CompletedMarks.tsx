import { Check } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

/** Green used for a completed game's check icon and title (darker in the light theme for contrast). */
export const COMPLETED_TEXT_CLASS = 'text-green-700 dark:text-green-400'

/** Solid green circle with a knocked-out check, shown beside a completed game's title. */
export function CompletedCheck({ size = 14, className = '' }: { size?: number; className?: string }) {
  const { t } = useLocale()
  return (
    <svg
      role="img"
      aria-label={t('completed.badge')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 ${COMPLETED_TEXT_CLASS} ${className}`}
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path
        d="M7 12.5l3.2 3.2L17 8.8"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-white dark:stroke-slate-900"
      />
    </svg>
  )
}

/**
 * Diagonal "Completed" ribbon for the top-right corner of a cover. The parent
 * must be `relative` and `overflow-hidden` (the ribbon overhangs the corner and
 * is clipped by it). Non-interactive so clicks fall through to the cover.
 */
export function CompletedRibbon() {
  const { t } = useLocale()
  return (
    <div className="pointer-events-none absolute top-0 right-0 size-28 overflow-hidden">
      <div className="absolute top-5 -right-9 flex w-36 rotate-45 items-center justify-center gap-1 bg-green-700 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-md">
        <Check size={12} strokeWidth={3} aria-hidden="true" />
        {t('completed.badge')}
      </div>
    </div>
  )
}
