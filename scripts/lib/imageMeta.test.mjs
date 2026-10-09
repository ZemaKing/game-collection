import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  extensionOf,
  formatBytes,
  imageSize,
  localPathFor,
} from './imageMeta.mjs'

const bytes = (...parts) =>
  new Uint8Array(
    parts.flatMap((p) =>
      typeof p === 'string' ? [...Buffer.from(p, 'ascii')] : p,
    ),
  )
const u16le = (n) => [n & 0xff, n >> 8]
const u16be = (n) => [n >> 8, n & 0xff]
const u24le = (n) => [n & 0xff, (n >> 8) & 0xff, n >> 16]
const u32be = (n) => [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
const u32le = (n) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24]
const riff = (chunk, body) =>
  bytes('RIFF', [0, 0, 0, 0], 'WEBP', chunk, [0, 0, 0, 0], body)

describe('imageSize', () => {
  it('reads PNG', () => {
    const png = bytes(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      [0, 0, 0, 13],
      'IHDR',
      u32be(1422),
      u32be(800),
    )
    expect(imageSize(png)).toEqual({ format: 'png', width: 1422, height: 800 })
  })

  it('reads GIF', () => {
    expect(imageSize(bytes('GIF89a', u16le(600), u16le(750)))).toEqual({
      format: 'gif',
      width: 600,
      height: 750,
    })
  })

  it('reads the three WebP flavours', () => {
    const lossy = riff('VP8 ', [
      0,
      0,
      0,
      0x9d,
      0x01,
      0x2a,
      ...u16le(1600),
      ...u16le(900),
    ])
    expect(imageSize(lossy)).toEqual({
      format: 'webp',
      width: 1600,
      height: 900,
    })

    const bits = (600 - 1) | ((750 - 1) << 14)
    const lossless = riff('VP8L', [0x2f, ...u32le(bits), 0, 0, 0, 0, 0, 0])
    expect(imageSize(lossless)).toEqual({
      format: 'webp',
      width: 600,
      height: 750,
    })

    const extended = riff('VP8X', [
      0x10,
      0,
      0,
      0,
      ...u24le(2014 - 1),
      ...u24le(1133 - 1),
    ])
    expect(imageSize(extended)).toEqual({
      format: 'webp',
      width: 2014,
      height: 1133,
    })
  })

  it('reads JPEG, skipping APP and DHT segments (DHT shares the SOF marker range)', () => {
    const jpeg = bytes(
      [0xff, 0xd8],
      [0xff, 0xe0, ...u16be(16)],
      'JFIF\0',
      new Array(9).fill(0),
      [0xff, 0xc4, ...u16be(4), 0, 0],
      [0xff, 0xc2, ...u16be(17), 8, ...u16be(1080), ...u16be(1920), 3],
      new Array(12).fill(0),
    )
    expect(imageSize(jpeg)).toEqual({
      format: 'jpeg',
      width: 1920,
      height: 1080,
    })
  })

  it('returns null for anything else', () => {
    expect(imageSize(bytes('hello world, not an image at all!'))).toBeNull()
    expect(imageSize(new Uint8Array())).toBeNull()
  })
})

describe('localPathFor', () => {
  it('maps a storage path inside the root', () => {
    expect(localPathFor('backups', 'game/abc/def.png')).toBe(
      path.join('backups', 'game', 'abc', 'def.png'),
    )
  })

  it.each([
    '',
    '/etc/passwd',
    '../x.png',
    'game/../../x.png',
    'game//x.png',
    'game\\x.png',
    'C:/x.png',
    'game/./x',
  ])('refuses %j', (bad) => {
    expect(() => localPathFor('backups', bad)).toThrow(/Unsafe storage path/)
  })
})

describe('formatBytes / extensionOf', () => {
  it('formats decimal units', () => {
    expect(formatBytes(999)).toBe('999 B')
    expect(formatBytes(1_410_000)).toBe('1.41 MB')
    expect(formatBytes(115_000)).toBe('115 kB')
    expect(formatBytes(2_000_000_000)).toBe('2.00 GB')
  })

  it('reads the lower-case extension of the file name only', () => {
    expect(extensionOf('game/a.b/c.JPG')).toBe('jpg')
    expect(extensionOf('game/a.b/noext')).toBe('')
  })
})
