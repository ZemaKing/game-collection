import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface BarListEntry {
  key: string
  label: string
  count: number
  /** Whole percent of the breakdown's total, shown next to the count when set. */
  percent?: number
  icon?: ComponentType<{ size?: number; className?: string }>
  /** A `text-*` class; the bar is drawn in `currentColor`, so it reuses the app's existing icon colors. */
  colorClass?: string
  to?: string
}

interface BarListProps {
  entries: BarListEntry[]
  label: string
}

/**
 * Horizontal bars ranked against the largest entry. The label and count are
 * real text in a list, so the bar itself is decorative (`aria-hidden`) and
 * the list is its own textual equivalent for screen readers.
 */
export function BarList({ entries, label }: BarListProps) {
  const max = Math.max(1, ...entries.map((e) => e.count))

  return (
    <ul aria-label={label} className="flex flex-col gap-1">
      {entries.map((entry) => {
        const Icon = entry.icon
        const width = entry.count === 0 ? 0 : Math.max(2, (entry.count / max) * 100)
        const body = (
          <>
            <span className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                {Icon && <Icon size={16} className={`shrink-0 ${entry.colorClass ?? 'text-muted'}`} />}
                <span className="truncate text-text">{entry.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {entry.count}
                {entry.percent !== undefined && <span className="text-tiny"> · {entry.percent}%</span>}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`mt-1 block h-1.5 overflow-hidden rounded-full bg-card-hover ${entry.colorClass ?? 'text-accent'}`}
            >
              <span className="block h-full rounded-full bg-current" style={{ width: `${width}%` }} />
            </span>
          </>
        )
        return (
          <li key={entry.key}>
            {entry.to ? (
              <Link
                to={entry.to}
                className="-mx-2 block rounded-lg px-2 py-1.5 transition-colors hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-accent"
              >
                {body}
              </Link>
            ) : (
              <div className="py-1.5">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export interface ColumnEntry {
  key: string
  /** Short axis label, e.g. "Sep". */
  label: string
  /** Unambiguous label for the screen-reader table, e.g. "September 2026". */
  fullLabel: string
  count: number
}

interface ColumnChartProps {
  entries: ColumnEntry[]
  /** Accessible name / table caption. */
  caption: string
  columnHeader: string
  valueHeader: string
}

/**
 * Vertical columns. The plot scrolls sideways inside its card on narrow
 * screens instead of squeezing the labels; a visually-hidden table carries the
 * same data for assistive tech, so the bars are `aria-hidden`.
 */
export function ColumnChart({ entries, caption, columnHeader, valueHeader }: ColumnChartProps) {
  const max = Math.max(1, ...entries.map((e) => e.count))
  const scrollRef = useRef<HTMLDivElement>(null)

  // When the plot overflows (narrow screens), open on the newest months — the
  // ones that matter — rather than the oldest.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [entries])

  return (
    <figure className="m-0">
      {/* Focusable so keyboard users can scroll the plot sideways when it overflows (WCAG 2.1.1). */}
      <div
        ref={scrollRef}
        tabIndex={0}
        role="group"
        aria-label={caption}
        className="-mx-1 overflow-x-auto rounded-md px-1 pb-1"
      >
        <div aria-hidden="true" className="flex min-w-[28rem] items-stretch gap-1.5">
          {entries.map((entry) => (
            <div key={entry.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-tiny tabular-nums text-muted">{entry.count > 0 ? entry.count : ''}&nbsp;</span>
              <div className="flex h-32 w-full items-end justify-center">
                <div
                  className="w-full max-w-9 rounded-t-md bg-accent"
                  style={{ height: entry.count === 0 ? 2 : `${Math.max(4, (entry.count / max) * 100)}%` }}
                />
              </div>
              <span className="text-tiny text-muted">{entry.label}</span>
            </div>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{columnHeader}</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.key}>
              <th scope="row">{entry.fullLabel}</th>
              <td>{entry.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** A single headline number with an icon and label. */
export function MetricTile({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <Icon size={16} className={`mb-1 ${iconColor}`} />
      <p className="stat-number text-text">{value}</p>
      <p className="stat-label text-muted">{label}</p>
    </div>
  )
}

interface StatCardProps {
  title: string
  note?: string
  children: ReactNode
  className?: string
}

/** A titled card, matching the dashboard's panel styling. */
export function StatCard({ title, note, children, className = '' }: StatCardProps) {
  return (
    <section className={`min-w-0 rounded-lg border border-border bg-surface p-4 ${className}`}>
      <h2 className="heading-section text-text">{title}</h2>
      {note && <p className="mt-0.5 mb-3 text-xs text-muted">{note}</p>}
      {!note && <div className="mb-3" />}
      {children}
    </section>
  )
}
