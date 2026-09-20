import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDate, formatRelativeTime } from '@/features/items/format'

describe('formatDate', () => {
  it('formats in the given locale', () => {
    expect(formatDate('2024-03-05T12:00:00Z', 'en')).toBe('March 5, 2024')
    expect(formatDate('2024-03-05T12:00:00Z', 'sr')).toMatch(/2024/)
  })
})

describe('formatRelativeTime', () => {
  afterEach(() => vi.useRealTimers())

  it('picks a sensible unit', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-31T12:00:00Z'))
    expect(formatRelativeTime('2026-01-31T12:00:00Z', 'en')).toBe('this minute')
    expect(formatRelativeTime('2026-01-31T09:00:00Z', 'en')).toBe('3 hours ago')
    expect(formatRelativeTime('2026-01-29T12:00:00Z', 'en')).toBe('2 days ago')
    expect(formatRelativeTime('2025-11-30T12:00:00Z', 'en')).toBe('2 months ago')
  })
})
