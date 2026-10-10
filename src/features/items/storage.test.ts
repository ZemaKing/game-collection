import { describe, expect, it } from 'vitest'
import { getImageUrls, imageObjectPaths, imagePathFor } from '@/features/items/storage'

const BASE = 'http://localhost:54321/storage/v1/object/public/item-images'

describe('image variants', () => {
  it('uses the thumb for "thumb" and the full image for "full"', () => {
    const row = { storage_path: 'game/1/a.webp', thumb_path: 'game/1/a.thumb.webp' }
    expect(imagePathFor(row, 'thumb')).toBe('game/1/a.thumb.webp')
    expect(imagePathFor(row, 'full')).toBe('game/1/a.webp')
    expect(getImageUrls(row)).toEqual({ full: `${BASE}/game/1/a.webp`, thumb: `${BASE}/game/1/a.thumb.webp` })
  })

  it('falls back to the full image until the row has a thumb', () => {
    for (const thumb_path of [null, undefined]) {
      expect(getImageUrls({ storage_path: 'game/1/a.png', thumb_path })).toEqual({
        full: `${BASE}/game/1/a.png`,
        thumb: `${BASE}/game/1/a.png`,
      })
    }
  })

  it('lists every object a row owns, once each', () => {
    expect(
      imageObjectPaths({ storage_path: 'g/1/r.webp', thumb_path: 'g/1/r.thumb.webp', original_path: 'g/1/u.png' }),
    ).toEqual(['g/1/r.webp', 'g/1/r.thumb.webp', 'g/1/u.png'])
    expect(imageObjectPaths({ storage_path: 'g/1/u.png', thumb_path: null, original_path: null })).toEqual(['g/1/u.png'])
    expect(
      imageObjectPaths({ storage_path: 'g/1/r.webp', thumb_path: 'g/1/r.thumb.webp', small_path: 'g/1/r.small.webp' }),
    ).toEqual(['g/1/r.webp', 'g/1/r.thumb.webp', 'g/1/r.small.webp'])
  })
})
