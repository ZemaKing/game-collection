import { describe, expect, it } from 'vitest'
import {
  clearViewOverrides,
  DEFAULT_SETTINGS,
  isViewOverrideKey,
  loadSettings,
  parseSettings,
  saveSettings,
  serializeSettings,
  SETTINGS_STORAGE_KEY,
  type Settings,
} from '@/features/settings/settings'

/** Minimal in-memory `Storage`, since the vitest environment is node (no `window`). */
function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  }
}

const CUSTOM: Settings = {
  theme: 'light',
  locale: 'en',
  viewMode: 'list',
  defaultSort: 'recently_added',
  platformSlugs: ['steam', 'playstation-5'],
  imageLoading: 'saver',
}

describe('parseSettings', () => {
  it('returns defaults for non-objects', () => {
    for (const bad of [null, undefined, 42, 'x', [], true]) {
      expect(parseSettings(bad)).toEqual(DEFAULT_SETTINGS)
    }
  })

  it('rejects a `system` theme, which is not offered', () => {
    expect(parseSettings({ theme: 'system' }).theme).toBe(DEFAULT_SETTINGS.theme)
  })

  it('accepts every valid value', () => {
    expect(parseSettings(CUSTOM)).toEqual(CUSTOM)
  })

  it('falls back per field, keeping the valid ones', () => {
    const parsed = parseSettings({
      theme: 'neon',
      locale: 'en',
      viewMode: 3,
      defaultSort: 'price',
      platformSlugs: 'steam',
      imageLoading: 'saver',
    })
    expect(parsed).toEqual({ ...DEFAULT_SETTINGS, locale: 'en', imageLoading: 'saver' })
  })

  it('cleans platform slugs: strings only, trimmed, unique, non-empty, bounded', () => {
    const parsed = parseSettings({
      platformSlugs: ['steam', ' steam ', '', 7, null, 'xbox', 'x'.repeat(65)],
    })
    expect(parsed.platformSlugs).toEqual(['steam', 'xbox'])
    expect(parseSettings({ platformSlugs: Array.from({ length: 200 }, (_, i) => `p${i}`) }).platformSlugs).toHaveLength(50)
  })

  it('never shares the defaults array with callers', () => {
    const a = parseSettings(null)
    a.platformSlugs.push('steam')
    expect(parseSettings(null).platformSlugs).toEqual([])
    expect(DEFAULT_SETTINGS.platformSlugs).toEqual([])
  })
})

describe('loadSettings / saveSettings', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage()
    saveSettings(storage, CUSTOM)
    expect(loadSettings(storage)).toEqual(CUSTOM)
  })

  it('returns defaults when storage is unavailable', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSettings(null, CUSTOM)).not.toThrow()
  })

  it('returns defaults for malformed JSON', () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_STORAGE_KEY]: '{not json' }))).toEqual(DEFAULT_SETTINGS)
  })

  it('sanitizes a stored blob with outdated or tampered values', () => {
    const stored = JSON.stringify({ version: 0, theme: 'sepia', locale: 'sr', viewMode: 'list', extra: 1 })
    expect(loadSettings(memoryStorage({ [SETTINGS_STORAGE_KEY]: stored }))).toEqual({
      ...DEFAULT_SETTINGS,
      viewMode: 'list',
    })
  })

  it('migrates the legacy theme and locale keys when no settings exist', () => {
    const storage = memoryStorage({ theme: 'light', locale: 'en' })
    expect(loadSettings(storage)).toEqual({ ...DEFAULT_SETTINGS, theme: 'light', locale: 'en' })
  })

  it('ignores invalid legacy values', () => {
    expect(loadSettings(memoryStorage({ theme: 'purple', locale: 'de' }))).toEqual(DEFAULT_SETTINGS)
  })

  it('prefers stored settings over legacy keys', () => {
    const storage = memoryStorage({ theme: 'dark', [SETTINGS_STORAGE_KEY]: serializeSettings(CUSTOM) })
    expect(loadSettings(storage).theme).toBe('light')
  })

  it('removes the legacy keys once settings are saved', () => {
    const storage = memoryStorage({ theme: 'light', locale: 'en', 'listing.game': 'list' })
    saveSettings(storage, loadSettings(storage))
    expect(storage.getItem('theme')).toBeNull()
    expect(storage.getItem('locale')).toBeNull()
    expect(storage.getItem('listing.game')).toBe('list')
    expect(loadSettings(storage)).toEqual({ ...DEFAULT_SETTINGS, theme: 'light', locale: 'en' })
  })

  it('does not throw when storage rejects writes', () => {
    const storage = memoryStorage()
    storage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(() => saveSettings(storage, CUSTOM)).not.toThrow()
  })
})

describe('view overrides', () => {
  it('recognizes only page-specific view keys', () => {
    expect(isViewOverrideKey('dashboard.view')).toBe(true)
    expect(isViewOverrideKey('listing.game')).toBe(true)
    expect(isViewOverrideKey('listing.platform.steam')).toBe(true)
    expect(isViewOverrideKey('settings')).toBe(false)
    expect(isViewOverrideKey('theme')).toBe(false)
  })

  it('clears every override and nothing else', () => {
    const storage = memoryStorage({
      'dashboard.view': 'list',
      'listing.all': 'grid',
      'listing.platform.xbox': 'list',
      [SETTINGS_STORAGE_KEY]: serializeSettings(CUSTOM),
      'recent-searches': '[]',
    })
    expect(clearViewOverrides(storage)).toBe(3)
    expect(storage.getItem('dashboard.view')).toBeNull()
    expect(storage.getItem('listing.all')).toBeNull()
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).not.toBeNull()
    expect(storage.getItem('recent-searches')).toBe('[]')
  })

  it('handles missing storage', () => {
    expect(clearViewOverrides(null)).toBe(0)
  })
})
