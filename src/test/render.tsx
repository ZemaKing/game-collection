import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { LocaleProvider } from '@/components/LocaleProvider'
import { SettingsProvider } from '@/components/SettingsProvider'
import { SETTINGS_STORAGE_KEY } from '@/features/settings/settings'
import { AuthContext, type AuthContextValue } from '@/hooks/useAuth'
import type { AllItemRow } from '@/features/items/types'

const signedOut: AuthContextValue = {
  user: null,
  session: null,
  loading: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
}

/** Renders with router, English locale, settings and (optionally signed-in) auth context. */
export function renderWithProviders(ui: ReactElement, { signedIn = false }: { signedIn?: boolean } = {}) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ locale: 'en' }))
  const auth = signedIn ? { ...signedOut, user: { id: 'owner' } as AuthContextValue['user'] } : signedOut
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <LocaleProvider>
          <AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>
        </LocaleProvider>
      </SettingsProvider>
    </MemoryRouter>,
  )
}

/** Stable fixture — every field is fixed so tests are deterministic. */
export function makeItem(overrides: Partial<AllItemRow> = {}): AllItemRow {
  return {
    id: 'item-1',
    item_type: 'game',
    title: 'Hades',
    subtitle: 'Supergiant Games',
    platform_id: null,
    release_date: '2020-09-17',
    collection_date: null,
    condition: 'sealed',
    notes: null,
    description: null,
    cover_image_path: null,
    genre_slug: null,
    genre_name: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}
