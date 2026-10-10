import { describe, expect, it } from 'vitest'

import { pngsToIco } from './ico.ts'

describe('pngsToIco', () => {
  it('writes the header, one directory entry per image, then the PNG bytes', () => {
    const a = new Uint8Array([1, 2, 3])
    const b = new Uint8Array([4, 5])
    const ico = pngsToIco([
      { width: 16, height: 16, png: a },
      { width: 256, height: 256, png: b },
    ])
    const view = new DataView(ico.buffer)

    expect(view.getUint16(2, true)).toBe(1)
    expect(view.getUint16(4, true)).toBe(2)
    expect(ico[6]).toBe(16)
    expect(view.getUint32(6 + 8, true)).toBe(3)
    expect(view.getUint32(6 + 12, true)).toBe(38)
    expect(ico[22]).toBe(0) // 256 is stored as 0
    expect(view.getUint32(22 + 12, true)).toBe(41)
    expect([...ico.slice(38)]).toEqual([1, 2, 3, 4, 5])
  })

  it('rejects an empty list and images over 256 px', () => {
    expect(() => pngsToIco([])).toThrow()
    expect(() =>
      pngsToIco([{ width: 512, height: 512, png: new Uint8Array() }]),
    ).toThrow()
  })
})
