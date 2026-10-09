// Builds the static images in public/ from their sources in static-src/ (ROADMAP Phase 38):
// the dashboard hero as responsive WebP, the og:image share card, and PNG favicons from
// public/favicon.svg. Deterministic and offline; re-run after changing a source, then commit
// the outputs.
//   npm run images:static
import { mkdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import sharp, { type Sharp } from 'sharp'

import {
  staticImageJobs,
  type StaticImageOutput,
} from './static-images/plan.ts'

const PUBLIC_DIR = resolve('public')
/** The icons get this much empty margin on each side (iOS crops close to the edge). */
const ICON_PADDING = 0.1

async function render(
  source: string,
  output: StaticImageOutput,
): Promise<Sharp> {
  const { width, height } = output
  // Rasterise SVGs large enough that the downscale stays sharp.
  let image = sharp(source, source.endsWith('.svg') ? { density: 300 } : {})

  if (height === undefined) {
    image = image.resize({ width, withoutEnlargement: true })
  } else if (output.background) {
    const inset = Math.round(Math.min(width, height) * ICON_PADDING)
    const inner = await image
      .resize({
        width: width - 2 * inset,
        height: height - 2 * inset,
        fit: 'contain',
        background: '#0000',
      })
      .png()
      .toBuffer()
    image = sharp({
      create: { width, height, channels: 4, background: output.background },
    }).composite([{ input: inner, gravity: 'centre' }])
  } else if (source.endsWith('.svg')) {
    image = image.resize({ width, height, fit: 'contain', background: '#0000' })
  } else {
    // The hero's subject sits on the right, as on the dashboard (bg-right).
    image = image.resize({ width, height, fit: 'cover', position: 'right' })
  }

  if (output.format === 'webp')
    return image.webp({ quality: output.quality, effort: 6 })
  if (output.format === 'jpeg')
    return image
      .flatten({ background: '#000' })
      .jpeg({ quality: output.quality, mozjpeg: true })
  return image.png({ compressionLevel: 9 })
}

async function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true })
  const hero = await sharp('static-src/dashboard_cover.png').metadata()

  for (const job of staticImageJobs(hero.width)) {
    for (const output of job.outputs) {
      const target = resolve(PUBLIC_DIR, output.file)
      const info = await (await render(job.source, output)).toFile(target)
      const kb = (statSync(target).size / 1024).toFixed(1)
      console.log(
        `${job.source} → public/${output.file}  ${info.width}×${info.height}  ${kb} KB`,
      )
    }
  }
}

await main()
