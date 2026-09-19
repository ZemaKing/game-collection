import { SORT_KEYS, type SortKey } from '@/features/items/sort'
import type { Locale } from '@/lib/i18n'

export type Theme = 'light' | 'dark'
export type ViewMode = 'grid' | 'list'
/**
 * lazy  — images load as they near the viewport (the app's original behavior).
 * eager — every image on a page loads immediately.
 * saver — listing cards show the type placeholder; images load on item pages.
 */
export type ImageLoading = 'lazy' | 'eager' | 'saver'

export interface Settings {
  theme: Theme
  locale: Locale
  /** Starting view for listings that don't have a page-specific choice yet. */
  viewMode: ViewMode
  /** Sort used when a listing's URL doesn't name one. */
  defaultSort: SortKey
  /** `platforms.slug` values shown in the navigation; empty means show every platform. */
  platformSlugs: string[]
  imageLoading: ImageLoading
}

export const THEMES: Theme[] = ['light', 'dark']
export const LOCALES: Locale[] = ['sr', 'en']
export const VIEW_MODES: ViewMode[] = ['grid', 'list']
export const IMAGE_LOADING_MODES: ImageLoading[] = ['lazy', 'eager', 'saver']

/** Same defaults the app shipped with before Settings existed (dark, Serbian, grid, title). */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  locale: 'sr',
  viewMode: 'grid',
  defaultSort: 'title',
  platformSlugs: [],
  imageLoading: 'lazy',
}

export const SETTINGS_STORAGE_KEY = 'settings'
const SETTINGS_VERSION = 1

/** Keys used before Settings centralized them; read once for migration, then removed on the next save. */
const LEGACY_KEYS = ['theme', 'locale'] as const

const MAX_PLATFORM_SLUGS = 50
const MAX_SLUG_LENGTH = 64

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function cleanSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const slugs = value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= MAX_SLUG_LENGTH)
  return Array.from(new Set(slugs)).slice(0, MAX_PLATFORM_SLUGS)
}

/**
 * Turns anything (a parsed JSON blob, a partial patch, garbage) into a valid
 * `Settings`. Each field is validated independently, so one corrupt or
 * outdated value falls back to its default without discarding the rest.
 */
export function parseSettings(raw: unknown): Settings {
  const obj = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  return {
    theme: oneOf(obj.theme, THEMES, DEFAULT_SETTINGS.theme),
    locale: oneOf(obj.locale, LOCALES, DEFAULT_SETTINGS.locale),
    viewMode: oneOf(obj.viewMode, VIEW_MODES, DEFAULT_SETTINGS.viewMode),
    defaultSort: oneOf(obj.defaultSort, SORT_KEYS, DEFAULT_SETTINGS.defaultSort),
    platformSlugs: cleanSlugs(obj.platformSlugs),
    imageLoading: oneOf(obj.imageLoading, IMAGE_LOADING_MODES, DEFAULT_SETTINGS.imageLoading),
  }
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify({ version: SETTINGS_VERSION, ...settings })
}

/**
 * Reads settings from storage. With no stored `settings` yet (first run after
 * this feature shipped) it falls back to the old standalone `theme`/`locale`
 * keys so nobody's existing choices are lost. Storage that is unavailable or
 * holds malformed JSON yields defaults instead of throwing.
 */
export function loadSettings(storage: StorageLike | null): Settings {
  if (!storage) return parseSettings(null)
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY)
    if (raw !== null) return parseSettings(JSON.parse(raw))
    return parseSettings({
      theme: storage.getItem('theme'),
      locale: storage.getItem('locale'),
    })
  } catch {
    return parseSettings(null)
  }
}

/** Persists settings (a no-op when storage is unavailable) and drops the legacy keys they replace. */
export function saveSettings(storage: StorageLike | null, settings: Settings): void {
  if (!storage) return
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(settings))
    for (const key of LEGACY_KEYS) storage.removeItem(key)
  } catch {
    // Quota exceeded / blocked storage: settings still apply for this session.
  }
}

/** Page-specific view choices written by `useListingPrefs` (dashboard, All Items, per type, per platform). */
export function isViewOverrideKey(key: string): boolean {
  return key === 'dashboard.view' || key.startsWith('listing.')
}

/** Forgets every page-specific view choice so all listings fall back to the default view. Returns how many were cleared. */
export function clearViewOverrides(storage: Storage | null): number {
  if (!storage) return 0
  try {
    const keys: string[] = []
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (key && isViewOverrideKey(key)) keys.push(key)
    }
    keys.forEach((key) => storage.removeItem(key))
    return keys.length
  } catch {
    return 0
  }
}

/** `window.localStorage`, or `null` where access throws (private mode, blocked site data). */
export function getBrowserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
