import { useLocale } from '@/hooks/useLocale'

interface CompletenessBadgeProps {
  percent: number
  /** Smaller variant for grid/list cards; the default is sized for the detail page. */
  compact?: boolean
}

export function CompletenessBadge({ percent, compact = false }: CompletenessBadgeProps) {
  const { t } = useLocale()

  return (
    <span
      title={t('completeness.tooltip', { percent: String(percent) })}
      className={`inline-flex shrink-0 items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} font-medium text-muted`}
    >
      <span className={`overflow-hidden rounded-full bg-card-hover ${compact ? 'h-1.5 w-8' : 'h-2 w-16'}`}>
        <span className="block h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </span>
      {percent}%
    </span>
  )
}
