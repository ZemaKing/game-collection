import { useLocale } from '@/hooks/useLocale'

interface CompletenessBadgeProps {
  percent: number
  /** Smaller variant for grid/list cards; the default is sized for the detail page. */
  compact?: boolean
  /** Bar stretches to fill the row instead of a fixed width — used on grid card footers. */
  full?: boolean
}

export function CompletenessBadge({ percent, compact = false, full = false }: CompletenessBadgeProps) {
  const { t } = useLocale()

  return (
    <span
      title={t('completeness.tooltip', { percent: String(percent) })}
      className={`inline-flex items-center gap-1.5 ${full ? 'w-full' : 'shrink-0'} ${compact ? 'text-xs' : 'text-sm'} font-medium text-muted`}
    >
      <span
        aria-hidden="true"
        className={`overflow-hidden rounded-full bg-card-hover ${full ? 'h-1.5 flex-1' : compact ? 'h-1.5 w-8' : 'h-2 w-16'}`}
      >
        <span className="block h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </span>
      <span className="sr-only">{t('completeness.tooltip', { percent: String(percent) })}</span>
      <span aria-hidden="true">{percent}%</span>
    </span>
  )
}
