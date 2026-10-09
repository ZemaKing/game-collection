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
 */
export const IMAGE_VARIANTS = {
  full: { maxWidth: 1600, maxHeight: 1600, quality: 85 },
  thumb: { maxWidth: 600, maxHeight: 750, quality: 85 },
} as const

/** Every object path is new (a changed photo gets a new UUID), so it can be cached for a year. */
export const IMAGE_CACHE_SECONDS = '31536000'
