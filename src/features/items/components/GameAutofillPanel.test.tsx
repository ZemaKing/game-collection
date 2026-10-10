// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GameAutofillPanel } from '@/features/items/components/GameAutofillPanel'
import { EMPTY_ITEM_FORM_STATE } from '@/features/items/forms/formState'
import type { GameAutofillDetail } from '@/features/items/gameAutofillApi'
import { renderWithProviders } from '@/test/render'

const SHOTS = ['https://media.rawg.io/s/1.jpg', 'https://media.rawg.io/s/2.jpg', 'https://media.rawg.io/s/3.jpg']

const fake = vi.hoisted(() => ({
  detail: null as GameAutofillDetail | null,
  failing: new Set<string>(),
}))

// The search hook and RAWG calls are stubbed: one result, a detail with a cover and 3 screenshots.
vi.mock('@/features/items/forms/useGameAutofillSearch', () => ({
  useGameAutofillSearch: () => ({
    results: [{ id: 7, title: 'A Plague Tale', releaseYear: '2019', coverUrl: null, platforms: [] }],
    loading: false,
    error: null,
  }),
}))
vi.mock('@/features/items/gameAutofillApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/items/gameAutofillApi')>()),
  fetchGameDetail: async () => fake.detail,
  fetchGameCoverFile: async (url: string, name: string) => {
    if (fake.failing.has(url)) throw new Error('download failed')
    return new File(['x'], name, { type: 'image/jpeg' })
  },
}))

function detail(overrides: Partial<GameAutofillDetail> = {}): GameAutofillDetail {
  return {
    title: 'A Plague Tale',
    released: null,
    descriptionRaw: null,
    developers: [],
    publishers: [],
    genres: [],
    platforms: [],
    backgroundImage: 'https://media.rawg.io/bg.jpg',
    screenshots: SHOTS,
    ...overrides,
  }
}

async function selectAndApply() {
  const onApply = vi.fn()
  const user = userEvent.setup()
  renderWithProviders(<GameAutofillPanel form={EMPTY_ITEM_FORM_STATE} genres={[]} platforms={[]} onApply={onApply} />)
  await user.type(screen.getByPlaceholderText('Search the RAWG game database...'), 'plague')
  await user.click(screen.getByRole('button', { name: /A Plague Tale/ }))
  await screen.findByText('Review & apply data')
  return { onApply, user }
}

describe('GameAutofillPanel images', () => {
  it('imports the cover and up to 3 screenshots, cover first', async () => {
    fake.detail = detail()
    fake.failing = new Set()
    const { onApply, user } = await selectAndApply()
    expect(screen.getByText('3 screenshots from RAWG (added to the gallery)')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Apply Selected' }))
    await waitFor(() => expect(onApply).toHaveBeenCalled())
    const files = onApply.mock.calls[0][1] as File[]
    expect(files.map((f) => f.name)).toEqual([
      'A Plague Tale.jpg',
      'A Plague Tale-1.jpg',
      'A Plague Tale-2.jpg',
      'A Plague Tale-3.jpg',
    ])
  })

  it('lets the owner leave the screenshots out, and skips one that fails to download', async () => {
    fake.detail = detail()
    fake.failing = new Set([SHOTS[1]])
    const { onApply, user } = await selectAndApply()
    await user.click(screen.getByRole('button', { name: 'Apply Selected' }))
    await waitFor(() => expect(onApply).toHaveBeenCalled())
    expect((onApply.mock.calls[0][1] as File[]).map((f) => f.name)).toEqual([
      'A Plague Tale.jpg',
      'A Plague Tale-1.jpg',
      'A Plague Tale-3.jpg',
    ])
  })

  it('unchecking the screenshots row imports only the cover', async () => {
    fake.detail = detail()
    fake.failing = new Set()
    const { onApply, user } = await selectAndApply()
    await user.click(screen.getByRole('checkbox', { name: /Screenshots/ }))
    await user.click(screen.getByRole('button', { name: 'Apply Selected' }))
    await waitFor(() => expect(onApply).toHaveBeenCalled())
    expect((onApply.mock.calls[0][1] as File[]).map((f) => f.name)).toEqual(['A Plague Tale.jpg'])
  })

  it('shows no screenshots row when RAWG has none', async () => {
    fake.detail = detail({ screenshots: [] })
    await selectAndApply()
    expect(screen.queryByText(/screenshots from RAWG/)).toBeNull()
  })
})
