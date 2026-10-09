// What scripts/build-static-images.ts writes into public/ (ROADMAP Phase 38). Pure, so it is tested
// without sharp; the sources live in static-src/ and never ship.

export type StaticImageOutput = {
  /** Path relative to public/. */
  file: string
  format: 'webp' | 'jpeg' | 'png'
  width: number
  /** Set only for outputs cropped to a fixed box (the share card, the icons). */
  height?: number
  quality?: number
  /** Opaque background for formats/contexts without transparency. */
  background?: string
}

export type StaticImageJob = {
  source: string
  outputs: StaticImageOutput[]
}

/** The hero is shown 110–160 px high across the content width (≈ 340–1200 CSS px): 1200 covers 1×
 *  screens and 2× phones, the source width covers 2× desktops. Never enlarged. */
export const HERO_WIDTHS = [1200, 2200]

export function heroWidths(
  sourceWidth: number,
  targets: number[] = HERO_WIDTHS,
): number[] {
  const widths = targets.map((w) => Math.min(w, sourceWidth))
  return [...new Set(widths)].sort((a, b) => a - b)
}

export function heroFile(width: number): string {
  return `dashboard_cover-${width}.webp`
}

/** `srcset` for the hero, in the same order as heroWidths. */
export function heroSrcSet(widths: number[]): string {
  return widths.map((w) => `/${heroFile(w)} ${w}w`).join(', ')
}

export function staticImageJobs(heroSourceWidth: number): StaticImageJob[] {
  return [
    {
      source: 'static-src/dashboard_cover.png',
      outputs: [
        ...heroWidths(heroSourceWidth).map((width): StaticImageOutput => ({
          file: heroFile(width),
          format: 'webp',
          width,
          quality: 80,
        })),
        // Link previews (og:image): 1200×630 is the common card size, and JPEG is the one format
        // every link-preview crawler reads.
        {
          file: 'og-image.jpg',
          format: 'jpeg',
          width: 1200,
          height: 630,
          quality: 82,
        },
      ],
    },
    {
      source: 'public/favicon.svg',
      outputs: [
        { file: 'favicon-32.png', format: 'png', width: 32, height: 32 },
        // iOS fills transparency with black and rounds the corners itself: give it a padded,
        // opaque square.
        {
          file: 'apple-touch-icon.png',
          format: 'png',
          width: 180,
          height: 180,
          background: '#ffffff',
        },
      ],
    },
  ]
}
