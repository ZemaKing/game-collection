// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ItemImage } from '@/features/items/components/ItemImage'
import { renderWithProviders } from '@/test/render'

const BASE = 'http://localhost:54321/storage/v1/object/public/item-images'
const paths = { storagePath: 'game/1/r.webp', thumbPath: 'game/1/r.thumb.webp' }
const img = () => screen.getByRole('img', { name: 'Cover' })

describe('ItemImage', () => {
  it('loads the thumb by default and the full image for variant="full"', () => {
    const { unmount } = renderWithProviders(<ItemImage {...paths} itemType="game" alt="Cover" />)
    expect(img().getAttribute('src')).toBe(`${BASE}/game/1/r.thumb.webp`)
    unmount()
    renderWithProviders(<ItemImage {...paths} variant="full" width={1600} height={900} itemType="game" alt="Cover" />)
    expect(img().getAttribute('src')).toBe(`${BASE}/game/1/r.webp`)
    expect([img().getAttribute('width'), img().getAttribute('height')]).toEqual(['1600', '900'])
  })

  it('uses the full image as the thumb until the row has one', () => {
    renderWithProviders(<ItemImage storagePath="game/1/u.png" thumbPath={null} itemType="game" alt="Cover" />)
    expect(img().getAttribute('src')).toBe(`${BASE}/game/1/u.png`)
  })

  it('falls back to the full image when the thumb fails, then to the placeholder', () => {
    renderWithProviders(<ItemImage {...paths} itemType="game" alt="Cover" />)
    fireEvent.error(img())
    expect(img().getAttribute('src')).toBe(`${BASE}/game/1/r.webp`)
    fireEvent.error(img())
    expect(screen.queryByRole('img', { name: 'Cover' })).toBeNull()
  })

  it('loads lazily and async by default; priority images eagerly at high priority', () => {
    const { unmount } = renderWithProviders(<ItemImage {...paths} itemType="game" alt="Cover" />)
    expect(img().getAttribute('loading')).toBe('lazy')
    expect(img().getAttribute('decoding')).toBe('async')
    expect(img().getAttribute('fetchpriority')).toBeNull()
    unmount()
    renderWithProviders(<ItemImage {...paths} priority itemType="game" alt="Cover" />)
    expect(img().getAttribute('loading')).toBe('eager')
    expect(img().getAttribute('fetchpriority')).toBe('high')
  })

  it('keeps deferrable thumbs as placeholders in data-saver mode, even with priority', () => {
    renderWithProviders(<ItemImage {...paths} priority deferrable itemType="game" alt="Cover" />, {
      settings: { imageLoading: 'saver' },
    })
    expect(screen.queryByRole('img', { name: 'Cover' })).toBeNull()
  })
})
