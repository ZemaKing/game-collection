/**
 * The stored WebP variants of every item image — shared by the browser upload
 * (`imageApi.ts`) and the migration job (`scripts/migrate-images/job.ts`), so
 * new uploads and migrated images come out the same. No imports: the scripts
 * type-check this file without the app's path aliases.
 *
 * Sizes fit the app's measured display sizes (ROADMAP Phase 33): cards are at
 * most ~300 CSS px wide at `aspect-[4/5]`, so 600×750 is sharp at 2×; the
 * viewer on a 1080p screen shows a 16:9 image at ~1600 px. Quality 85 is the
 * owner's choice. Both fit inside the box and are never enlarged.
 *
 * `small` (Phase 39 gap 3) is for phones and small slots: every card and
 * strip shows images at `aspect-[4/5]` with `object-cover`, so it is cropped
 * to exactly that box (the same centre crop the browser would show) at
 * 400×500 — enough for a phone card (≈ 165–190 CSS px) at 2×. Picked through
 * `srcset`/`sizes` (`imageSizes.ts`), never shown uncropped.
 */
export const IMAGE_VARIANTS = {
  full: { maxWidth: 1600, maxHeight: 1600, quality: 85 },
  thumb: { maxWidth: 600, maxHeight: 750, quality: 85 },
  small: { maxWidth: 400, maxHeight: 500, quality: 85, fit: 'cover' },
} as const

/** Every object path is new (a changed photo gets a new UUID), so it can be cached for a year. */
export const IMAGE_CACHE_SECONDS = '31536000'
