import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ItemImageRow } from '@/features/items/detailTypes'
import { appendItemImages, replaceItemImageFile, uploadItemImage } from '@/features/items/imageApi'
import type { ResizedImage, ResizeVariant } from '@/lib/image-resize'

// A fake Supabase: records every Storage call and the row written, and can be told to fail.
const fake = vi.hoisted(() => ({
  log: [] as string[],
  uploads: [] as { path: string; contentType: string; cacheControl: string }[],
  failUploadOf: null as string | null,
  dbError: null as { message: string } | null,
  written: null as Record<string, unknown> | null,
  resizeCalls: [] as ResizeVariant[][],
  encoded: 'image/webp',
  resizeError: null as Error | null,
  existingImages: 0,
}))

vi.mock('@/features/items/detailApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/items/detailApi')>()),
  fetchItemImages: async () => Array.from({ length: fake.existingImages }, (_, i) => ({ id: `old-${i}` })),
}))

vi.mock('@/lib/supabaseClient', () => {
  const bucket = {
    upload: async (path: string, _blob: Blob, opts: { contentType: string; cacheControl: string }) => {
      fake.log.push(`upload ${path}`)
      if (fake.failUploadOf && path.endsWith(fake.failUploadOf)) return { error: { message: 'Storage is full' } }
      fake.uploads.push({ path, ...opts })
      return { error: null }
    },
    remove: async (paths: string[]) => {
      fake.log.push(`remove ${paths.join(' ')}`)
      return { error: null }
    },
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
  }
  const write = (op: string) => (payload: Record<string, unknown>) => {
    fake.log.push(op)
    fake.written = payload
    const result = () => (fake.dbError ? { data: null, error: fake.dbError } : { data: { id: 'row-1', ...payload }, error: null })
    const chain = { eq: () => chain, select: () => chain, single: async () => result() }
    return chain
  }
  return {
    supabase: {
      storage: { from: () => bucket },
      from: () => ({ insert: write('insert row'), update: write('update row') }),
    },
  }
})

vi.mock('@/lib/image-resize', () => ({
  resizeImageVariants: async (_file: Blob, variants: ResizeVariant[]): Promise<ResizedImage[]> => {
    fake.resizeCalls.push(variants)
    if (fake.resizeError) throw fake.resizeError
    const ext = fake.encoded === 'image/webp' ? 'webp' : 'png'
    return variants.map((v) => ({
      name: v.name,
      blob: new Blob(['x'], { type: fake.encoded }),
      width: v.name === 'full' ? 1600 : v.name === 'thumb' ? 600 : 400,
      height: v.name === 'full' ? 900 : v.name === 'thumb' ? 338 : 500,
      type: fake.encoded,
      ext,
    }))
  },
}))

const photo = new File(['jpeg bytes'], 'photo.jpg', { type: 'image/jpeg' })
const PATH = /^game\/item-1\/[0-9a-f-]{36}\.webp$/

beforeEach(() => {
  Object.assign(fake, {
    log: [],
    uploads: [],
    failUploadOf: null,
    dbError: null,
    written: null,
    resizeCalls: [],
    encoded: 'image/webp',
    resizeError: null,
    existingImages: 0,
  })
})

describe('uploadItemImage', () => {
  it('converts to full + thumb + small WebP, uploads all three cached for a year, then writes the row', async () => {
    const stages: string[] = []
    const row = await uploadItemImage('game', 'item-1', photo, 3, false, (s) => stages.push(s))

    expect(fake.resizeCalls[0]).toEqual([
      { name: 'full', maxWidth: 1600, maxHeight: 1600, quality: 0.85 },
      { name: 'thumb', maxWidth: 600, maxHeight: 750, quality: 0.85 },
      { name: 'small', maxWidth: 400, maxHeight: 500, quality: 0.85, fit: 'cover' },
    ])
    expect(stages).toEqual(['optimizing', 'uploading'])
    const [full, thumb, small] = fake.uploads
    expect(full.path).toMatch(PATH)
    expect(thumb.path).toBe(full.path.replace(/\.webp$/, '.thumb.webp'))
    expect(small.path).toBe(full.path.replace(/\.webp$/, '.small.webp'))
    for (const upload of fake.uploads) expect(upload).toMatchObject({ contentType: 'image/webp', cacheControl: '31536000' })
    expect(fake.log.map((l) => l.split(' ')[0])).toEqual(['upload', 'upload', 'upload', 'insert'])
    expect(fake.written).toEqual({
      item_type: 'game',
      item_id: 'item-1',
      storage_path: full.path,
      thumb_path: thumb.path,
      small_path: small.path,
      width: 1600,
      height: 900,
      position: 3,
      is_cover: false,
    })
    expect(row).toMatchObject({ storage_path: full.path, thumb_path: thumb.path })
  })

  it('stores PNG where the browser cannot encode WebP', async () => {
    fake.encoded = 'image/png'
    await uploadItemImage('game', 'item-1', photo, 0, true)
    expect(fake.uploads.map((u) => [u.path.split('.').slice(1).join('.'), u.contentType])).toEqual([
      ['png', 'image/png'],
      ['thumb.png', 'image/png'],
      ['small.png', 'image/png'],
    ])
  })

  it('removes the full image when the thumb upload fails, and writes no row', async () => {
    fake.failUploadOf = '.thumb.webp'
    await expect(uploadItemImage('game', 'item-1', photo, 0, true)).rejects.toMatchObject({ message: 'Storage is full' })
    const full = fake.uploads[0].path
    expect(fake.log).toEqual([`upload ${full}`, `upload ${full.replace('.webp', '.thumb.webp')}`, `remove ${full}`])
    expect(fake.written).toBeNull()
  })

  it('removes the full image and thumb when the small upload fails', async () => {
    fake.failUploadOf = '.small.webp'
    await expect(uploadItemImage('game', 'item-1', photo, 0, true)).rejects.toMatchObject({ message: 'Storage is full' })
    const [full, thumb] = fake.uploads.map((u) => u.path)
    expect(fake.log.at(-1)).toBe(`remove ${full} ${thumb}`)
    expect(fake.written).toBeNull()
  })

  it('removes every upload when the row insert fails', async () => {
    fake.dbError = { message: 'RLS says no' }
    await expect(uploadItemImage('game', 'item-1', photo, 0, true)).rejects.toMatchObject({ message: 'RLS says no' })
    const [full, thumb, small] = fake.uploads.map((u) => u.path)
    expect(fake.log.at(-1)).toBe(`remove ${full} ${thumb} ${small}`)
  })

  it('uploads nothing when the image cannot be decoded', async () => {
    fake.resizeError = new Error('The source image could not be decoded.')
    await expect(uploadItemImage('game', 'item-1', photo, 0, true)).rejects.toThrow('could not be decoded')
    expect(fake.log).toEqual([])
  })
})

describe('replaceItemImageFile', () => {
  const old: ItemImageRow = {
    id: 'row-1',
    storage_path: 'game/item-1/old.webp',
    thumb_path: 'game/item-1/old.thumb.webp',
    small_path: 'game/item-1/old.small.webp',
    original_path: 'game/item-1/old-original.png',
    width: 1200,
    height: 900,
    position: 0,
    is_cover: true,
    alt_text: null,
  }

  it('stores the new variants, points the row at them, then removes every old object', async () => {
    const row = await replaceItemImageFile(old, photo)
    const [full, thumb, small] = fake.uploads.map((u) => u.path)
    expect(full).toMatch(PATH)
    expect(fake.written).toEqual({
      storage_path: full,
      thumb_path: thumb,
      small_path: small,
      width: 1600,
      height: 900,
      original_path: null,
    })
    expect(fake.log.slice(-2)).toEqual([
      'update row',
      'remove game/item-1/old.webp game/item-1/old.thumb.webp game/item-1/old.small.webp game/item-1/old-original.png',
    ])
    expect(row).toMatchObject({ storage_path: full, thumb_path: thumb })
  })

  it('keeps the old objects and removes the new ones when the row update fails', async () => {
    fake.dbError = { message: 'offline' }
    await expect(replaceItemImageFile(old, photo)).rejects.toMatchObject({ message: 'offline' })
    const [full, thumb, small] = fake.uploads.map((u) => u.path)
    expect(fake.log.at(-1)).toBe(`remove ${full} ${thumb} ${small}`)
    expect(fake.log.some((l) => l.includes('old'))).toBe(false)
  })
})

describe('appendItemImages', () => {
  const shot = (name: string) => new File(['x'], name, { type: 'image/jpeg' })

  it('appends in order after the existing images; the first is the cover only on an empty item', async () => {
    expect(await appendItemImages('game', 'item-1', [shot('cover.jpg'), shot('s1.jpg'), shot('s2.jpg')])).toBe(0)
    const rows = fake.log.filter((l) => l === 'insert row').length
    expect(rows).toBe(3)
    // The last written row: third position, not the cover.
    expect(fake.written).toMatchObject({ position: 2, is_cover: false })

    Object.assign(fake, { log: [], uploads: [], existingImages: 2 })
    await appendItemImages('game', 'item-1', [shot('cover.jpg')])
    expect(fake.written).toMatchObject({ position: 2, is_cover: false })
  })

  it('keeps going past a failed file and reports how many failed', async () => {
    fake.failUploadOf = '.small.webp'
    expect(await appendItemImages('game', 'item-1', [shot('a.jpg'), shot('b.jpg')])).toBe(2)
    fake.failUploadOf = null
    expect(await appendItemImages('game', 'item-1', [])).toBe(0)
  })
})
