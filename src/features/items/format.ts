import type { Locale } from '@/lib/i18n'

const RELATIVE_UNITS: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: 'minute' },
  { limit: 60 * 24, divisor: 60, unit: 'hour' },
  { limit: 60 * 24 * 30, divisor: 60 * 24, unit: 'day' },
  { limit: Infinity, divisor: 60 * 24 * 30, unit: 'month' },
]

export function formatRelativeTime(iso: string, locale: Locale): string {
  const diffMinutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  const formatter = new Intl.RelativeTimeFormat(locale === 'sr' ? 'sr' : 'en', {
    numeric: 'auto',
  })
  const absMinutes = Math.abs(diffMinutes)
  if (absMinutes < 1) return formatter.format(0, 'minute')
  const { divisor, unit } = RELATIVE_UNITS.find((u) => absMinutes < u.limit) ?? RELATIVE_UNITS[3]
  return formatter.format(Math.round(diffMinutes / divisor), unit)
}
