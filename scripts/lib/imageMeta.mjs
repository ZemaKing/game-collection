// Pure helpers for the image scripts (Phase 32): read an image's pixel size from its header
// bytes (PNG / JPEG / WebP / GIF — no decoder, no dependency), map Storage paths to safe local
// paths, and format byte counts.
import path from 'node:path'

/**
 * Width/height from the first bytes of an image, or null if the format isn't recognised.
 * JPEG needs the bytes up to its SOF marker, so pass the whole file.
 * @param {Uint8Array} bytes
 * @returns {{ format: 'png' | 'jpeg' | 'webp' | 'gif', width: number, height: number } | null}
 */
export function imageSize(bytes) {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // PNG: signature, then the IHDR chunk (width/height big-endian at 16/20).
  if (
    b.length >= 24 &&
    b.readUInt32BE(0) === 0x89504e47 &&
    b.toString('ascii', 12, 16) === 'IHDR'
  ) {
    return {
      format: 'png',
      width: b.readUInt32BE(16),
      height: b.readUInt32BE(20),
    }
  }
  // GIF: "GIF87a"/"GIF89a", logical screen size little-endian at 6/8.
  if (b.length >= 10 && b.toString('ascii', 0, 4) === 'GIF8') {
    return {
      format: 'gif',
      width: b.readUInt16LE(6),
      height: b.readUInt16LE(8),
    }
  }
  // WebP: RIFF....WEBP, then a VP8 / VP8L / VP8X chunk.
  if (
    b.length >= 30 &&
    b.toString('ascii', 0, 4) === 'RIFF' &&
    b.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const chunk = b.toString('ascii', 12, 16)
    if (chunk === 'VP8 ') {
      return {
        format: 'webp',
        width: b.readUInt16LE(26) & 0x3fff,
        height: b.readUInt16LE(28) & 0x3fff,
      }
    }
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21)
      return {
        format: 'webp',
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      }
    }
    if (chunk === 'VP8X') {
      return {
        format: 'webp',
        width: b.readUIntLE(24, 3) + 1,
        height: b.readUIntLE(27, 3) + 1,
      }
    }
    return null
  }
  // JPEG: walk the segments to the first SOFn (not DHT/JPG/DAC, which share the C4/C8/CC range).
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null
      const marker = b[i + 1]
      if (marker === 0xff) {
        i += 1 // fill byte
        continue
      }
      if (
        marker === 0xd8 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      ) {
        i += 2 // standalone markers
        continue
      }
      const length = b.readUInt16BE(i + 2)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          format: 'jpeg',
          width: b.readUInt16BE(i + 7),
          height: b.readUInt16BE(i + 5),
        }
      }
      i += 2 + length
    }
  }
  return null
}

/**
 * Local file for a Storage object path, inside `root`. Throws on anything that could escape it
 * (absolute paths, "..", backslashes, empty segments) — paths come from the database.
 * @param {string} root
 * @param {string} storagePath
 */
export function localPathFor(root, storagePath) {
  const segments = storagePath.split('/')
  if (
    !storagePath ||
    storagePath.startsWith('/') ||
    storagePath.includes('\\') ||
    storagePath.includes('\0') ||
    segments.some(
      (s) => s === '' || s === '.' || s === '..' || /^[a-zA-Z]:$/.test(s),
    )
  ) {
    throw new Error(`Unsafe storage path: ${JSON.stringify(storagePath)}`)
  }
  return path.join(root, ...segments)
}

/** "1.41 MB"-style byte count (decimal units, like the Supabase dashboard). */
export function formatBytes(bytes) {
  if (bytes < 1000) return `${bytes} B`
  const units = ['kB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = -1
  do {
    value /= 1000
    unit += 1
  } while (value >= 1000 && unit < units.length - 1)
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unit]}`
}

/** Lower-case file extension of a Storage path ("png", "jpg", …), or "" if none. */
export function extensionOf(storagePath) {
  const name = storagePath.slice(storagePath.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}
