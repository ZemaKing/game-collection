/**
 * `sizes` for images that offer the `small` variant (400×500, see
 * `imageVariants.ts`) next to the thumb through `srcset` (ROADMAP Phase 39,
 * gap 3). They tell the browser how wide the slot is, so it can pick the
 * smallest file that is still sharp.
 *
 * Card widths, measured 2026-10-10 on the listing and the dashboard:
 *  - phones (< 640 px): two columns, exactly `(100vw − 62px) / 2` (149 px at
 *    360, 175 px at 412, 289 px at 639);
 *  - from 640 px up: at most 281 px (dashboard at 1535), 134–268 px elsewhere.
 *
 * Phones at ≥ 2.5× density (most of them) would otherwise want ≈ 3 × 175 =
 * 525 px and always pick the 600 px thumb. A 175 px card at 2× is already
 * sharp, so the slot is reported as two thirds of its width there, which
 * makes the browser pick the small file.
 */
const PHONE = '(max-width: 639px)'
const HIGH_DENSITY = '(min-resolution: 2.5dppx)'
const PHONE_CARD = 'calc(50vw - 31px)'

/** Grid cards (`ItemCard`, listings, dashboard, related items). */
export const CARD_IMAGE_SIZES = `${PHONE} and ${HIGH_DENSITY} calc((50vw - 31px) * 0.66), ${PHONE} ${PHONE_CARD}, 282px`

/** Small slots: list-view rows (56–64 px), the detail gallery grid (≤ 120 px) and the viewer strip. */
export const STRIP_IMAGE_SIZES = '120px'
