// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MediaViewer } from '@/features/items/components/MediaViewer'
import type { ItemImageRow } from '@/features/items/detailTypes'
import { renderWithProviders } from '@/test/render'

const BASE = 'http://localhost:54321/storage/v1/object/public/item-images'

function image(n: number): ItemImageRow {
  return {
    id: `img-${n}`,
    storage_path: `game/1/${n}.webp`,
    thumb_path: `game/1/${n}.thumb.webp`,
    width: 1600,
    height: 900,
    position: n,
    is_cover: n === 1,
    alt_text: `Photo ${n}`,
  }
}

const THREE = [image(1), image(2), image(3)]

function setup({
  images = THREE,
  initialIndex = 0,
  settings = {},
}: {
  images?: ItemImageRow[]
  initialIndex?: number
  settings?: Record<string, unknown>
} = {}) {
  const onOpenChange = vi.fn()
  renderWithProviders(
    <MediaViewer
      images={images}
      itemType="game"
      itemTitle="Hades"
      open
      initialIndex={initialIndex}
      onOpenChange={onOpenChange}
    />,
    { settings },
  )
  return { onOpenChange, user: userEvent.setup() }
}

const counter = () => screen.getByText(/^\d+ \/ \d+$/).textContent
const stage = () => screen.getByRole('img', { name: /^Photo \d$/ })
/** ItemImage puts the sizing classes (here: the zoom state) on its wrapper. */
const stageBox = () => stage().parentElement!

afterEach(() => vi.unstubAllGlobals())

describe('MediaViewer', () => {
  it('opens on the requested image at full size, titled after the item', () => {
    setup({ initialIndex: 1 })
    expect(screen.getByRole('dialog', { name: 'Hades' })).toBeTruthy()
    expect(counter()).toBe('2 / 3')
    expect(stage().getAttribute('src')).toBe(`${BASE}/game/1/2.webp`)
    expect(
      screen
        .getByRole('button', { name: 'Show image 2 of 3' })
        .getAttribute('aria-current'),
    ).toBe('true')
  })

  it('steps with the previous/next buttons and wraps around both ends', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Previous image' }))
    expect(counter()).toBe('3 / 3')
    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(counter()).toBe('1 / 3')
    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(stage().getAttribute('alt')).toBe('Photo 2')
  })

  it('steps with the arrow keys', async () => {
    const { user } = setup()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(counter()).toBe('3 / 3')
    await user.keyboard('{ArrowLeft}')
    expect(counter()).toBe('2 / 3')
  })

  it('jumps to an image from the thumbnail strip, which loads thumbs', async () => {
    const { user } = setup()
    const thumb = screen.getByRole('button', { name: 'Show image 3 of 3' })
    expect(thumb.querySelector('img')?.getAttribute('src')).toBe(
      `${BASE}/game/1/3.thumb.webp`,
    )
    await user.click(thumb)
    expect(counter()).toBe('3 / 3')
    expect(thumb.getAttribute('aria-current')).toBe('true')
  })

  it('swipes: right goes back, left goes forward, short drags do nothing', () => {
    setup()
    const dialog = screen.getByRole('dialog')
    const swipe = (from: number, to: number) => {
      // Both lists on both events: Radix's scroll lock reads them too.
      const at = (clientX: number) => ({
        touches: [{ clientX, clientY: 0 }],
        changedTouches: [{ clientX, clientY: 0 }],
      })
      fireEvent.touchStart(dialog, at(from))
      fireEvent.touchEnd(dialog, at(to))
    }
    swipe(200, 100)
    expect(counter()).toBe('2 / 3')
    swipe(100, 200)
    expect(counter()).toBe('1 / 3')
    swipe(100, 130)
    expect(counter()).toBe('1 / 3')
  })

  it('toggles zoom, and un-zooms when the image changes', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(stageBox().className).toContain('cursor-zoom-out')
    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy()
    expect(stageBox().className).toContain('cursor-zoom-in')
  })

  it('closes through the close button', async () => {
    const { onOpenChange, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('has no navigation or strip for a single image', () => {
    setup({ images: [image(1)] })
    expect(counter()).toBe('1 / 1')
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Show image/ })).toBeNull()
  })

  it('preloads only the neighbours’ full images, and nothing in data-saver mode', () => {
    const preloaded: string[] = []
    class FakeImage {
      set src(value: string) {
        preloaded.push(value)
      }
    }
    vi.stubGlobal('Image', FakeImage)
    setup({ images: [image(1), image(2), image(3), image(4)], initialIndex: 2 })
    expect(preloaded.sort()).toEqual([
      `${BASE}/game/1/2.webp`,
      `${BASE}/game/1/4.webp`,
    ])
    cleanup()

    preloaded.length = 0
    setup({ settings: { imageLoading: 'saver' } })
    expect(preloaded).toEqual([])
  })
})
