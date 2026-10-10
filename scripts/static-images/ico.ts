// Wraps PNG images in an ICO container (PNG-in-ICO, read by every browser since Windows Vista).
// sharp can't write ICO, and Vercel's dashboard takes a project's icon from /favicon.ico only.

export type IcoEntry = { width: number; height: number; png: Uint8Array }

const HEADER_SIZE = 6
const DIRECTORY_ENTRY_SIZE = 16

export function pngsToIco(entries: IcoEntry[]): Uint8Array {
  if (entries.length === 0) throw new Error('An ICO needs at least one image')
  const dataStart = HEADER_SIZE + DIRECTORY_ENTRY_SIZE * entries.length
  const total = entries.reduce((sum, e) => sum + e.png.length, dataStart)
  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)

  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: icon
  view.setUint16(4, entries.length, true)

  let offset = dataStart
  entries.forEach((entry, i) => {
    if (entry.width > 256 || entry.height > 256)
      throw new Error('ICO images are at most 256×256')
    const at = HEADER_SIZE + DIRECTORY_ENTRY_SIZE * i
    view.setUint8(at, entry.width % 256) // 0 means 256
    view.setUint8(at + 1, entry.height % 256)
    view.setUint8(at + 2, 0) // no palette
    view.setUint8(at + 3, 0) // reserved
    view.setUint16(at + 4, 1, true) // colour planes
    view.setUint16(at + 6, 32, true) // bits per pixel
    view.setUint32(at + 8, entry.png.length, true)
    view.setUint32(at + 12, offset, true)
    out.set(entry.png, offset)
    offset += entry.png.length
  })
  return out
}
