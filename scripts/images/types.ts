// Types for the reusable image pipeline (ROADMAP Phase 21). Nothing in scripts/images/ knows about
// the app that uses it: an app describes its images as an ImageJob (see README.md) and runs the CLI.
import type {SupabaseClient} from "@supabase/supabase-js";

// One output size. Every variant is WebP, resized to fit inside maxWidth × maxHeight (never
// enlarged), EXIF-rotated and stripped of metadata.
export type Variant = {
    name: string; // fills {variant} in the path pattern, e.g. "full" | "thumb"
    maxWidth: number;
    maxHeight?: number; // default: maxWidth, i.e. the longest edge is bounded
    quality: number; // WebP quality, 1–100
    // "inside" (default): fit inside the box. "cover": fill the box and crop the overflow from the
    // centre, so the output has the box's aspect ratio (for slots that show the image cropped).
    fit?: "inside" | "cover";
    // Storage key for this variant only, instead of the job's pathPattern — for layouts where the
    // variants differ by more than a {variant} segment (e.g. "{id}.webp" + "{id}.thumb.webp").
    pathPattern?: string;
};

// One original image to convert. `vars` fill the path pattern's placeholders.
export type ImageSource = {
    key: string; // unique and stable — used in logs, --only and the manifest
    url: string; // where the original is downloaded from — and its identity in the manifest
    vars: Record<string, string | number>;
    // Local source: read the original from this file instead of downloading `url` (no egress).
    // A missing file fails the source; it never falls back to the network.
    file?: string;
    // Expected sha256 of the original (e.g. from a backup manifest); a mismatch fails the source.
    sha256?: string;
};

export type ImageJob = {
    name: string;
    bucket: string;
    // Storage key per source × variant. Placeholders: {variant}, {ext} ("webp") + the source's vars.
    pathPattern: string;
    variants: Variant[];
    // Resume state + checksums (JSON). Rewritten after every source, so an interrupted run resumes.
    manifest: URL;
    cacheControl?: string; // seconds, default 604800 (a week)
    concurrency?: number; // default 4
    retries?: number; // default 4 (so up to 5 attempts per request)
    sources(supabase: SupabaseClient): Promise<ImageSource[]>;
};

// Where the converted files go. `supabaseTarget()` is the real one; tests use an in-memory fake.
export interface StorageTarget {
    stat(path: string): Promise<{size: number} | null>;
    upload(path: string, data: Buffer, options: {contentType: string; cacheControl: string}): Promise<void>;
    publicUrl(path: string): string;
}
