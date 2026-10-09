-- Phase 36 — Upload Path: the bucket only accepts what the browser now stores.
--
-- Every upload is converted in the browser (src/lib/image-resize.ts) to a
-- full + thumb WebP, or PNG where a browser can't encode WebP; the migration
-- job (scripts/migrate-images) uploads WebP. So Storage no longer needs to
-- accept JPEG or GIF: an old client or a hand-made upload that skips the
-- conversion is refused instead of filling the bucket with multi-MB files.
-- Existing objects are not affected (the check runs on upload only).
--
-- Apply AFTER the Phase 36 code is deployed: until then the deployed app still
-- uploads the picked file as-is and JPEG/GIF uploads would fail.
--
-- The 10 MB limit stays: a converted full image is ~100–300 KB as WebP and at
-- most a few MB as the PNG fallback. Re-runnable.

update storage.buckets
set allowed_mime_types = array['image/webp', 'image/png'],
    file_size_limit = 10485760 -- 10 MB
where id = 'item-images';
