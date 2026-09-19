import type { Locale } from '@/lib/i18n'

// The rest of the app's Serbian text is Latin script; plain 'sr'/'sr-RS'
// defaults to Cyrillic in Intl formatters, so it's pinned to 'sr-Latn-RS'
// wherever a locale-aware Intl formatter is built.
const INTL_LOCALE: Record<Locale, string> = { sr: 'sr-Latn-RS', en: 'en-US' }

export function formatDate(isoDate: string, locale: Locale): string {
  const formatter = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return formatter.format(new Date(isoDate))
}

/** "September 2026" — takes a local-time `Date`, so a plain calendar date never shifts a day across timezones. */
export function formatMonthYear(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: 'long', year: 'numeric' }).format(date)
}

const RELATIVE_UNITS: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: 'minute' },
  { limit: 60 * 24, divisor: 60, unit: 'hour' },
  { limit: 60 * 24 * 30, divisor: 60 * 24, unit: 'day' },
  { limit: Infinity, divisor: 60 * 24 * 30, unit: 'month' },
]

export function formatRelativeTime(iso: string, locale: Locale): string {
  const diffMinutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  const formatter = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], {
    numeric: 'auto',
  })
  const absMinutes = Math.abs(diffMinutes)
  if (absMinutes < 1) return formatter.format(0, 'minute')
  const { divisor, unit } = RELATIVE_UNITS.find((u) => absMinutes < u.limit) ?? RELATIVE_UNITS[3]
  return formatter.format(Math.round(diffMinutes / divisor), unit)
}
