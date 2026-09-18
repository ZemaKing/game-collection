import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  body: string
  action?: ReactNode
  /** Compact variant drops the dashed border/box padding, for use inside already-boxed contexts (e.g. search panel). */
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, body, action, compact = false }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted">
        {body}
        {action}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
      {Icon && <Icon size={32} className="text-muted" />}
      {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action}
    </div>
  )
}
