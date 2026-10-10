// Browser-side image resize → WebP (ROADMAP Phase 21; the Phase 27 upload form uses it).
// Self-contained on purpose — no imports — so the games and recipes apps can copy this one file.
// Same rules as the batch converter in scripts/images/: fit inside maxWidth × maxHeight (or, with
// fit "cover", fill it and crop the centre), never enlarge, EXIF orientation applied, metadata
// dropped (a canvas re-encode carries none).
//
//   const [full, thumb] = await resizeImageVariants(file, [
//       {name: "full", maxWidth: 1600, quality: 0.82},
//       {name: "thumb", maxWidth: 400, quality: 0.75},
//   ]);
//   // full.blob, full.width, full.height, full.ext ("webp" — or "png" where the browser can't encode WebP)

export type ResizeVariant = {
    name: string;
    maxWidth: number;
    maxHeight?: number; // default: maxWidth (bounds the longest edge)
    quality?: number; // 0–1, default 0.8
    fit?: "inside" | "cover"; // default "inside"; "cover" fills the box and crops the centre
};

export type ResizedImage = {
    name: string;
    blob: Blob;
    width: number;
    height: number;
    type: string; // what the browser actually produced
    ext: "webp" | "png" | "jpg";
};

type Size = {width: number; height: number};
type Drawable = CanvasImageSource & Size;
type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

const WEBP = "image/webp";

// Largest size with the same aspect ratio that fits inside the box; never larger than the original.
export function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number = maxWidth): Size {
    if (!(width > 0 && height > 0)) throw new Error(`Invalid image size ${width}×${height}.`);
    if (!(maxWidth > 0 && maxHeight > 0)) throw new Error(`Invalid bounds ${maxWidth}×${maxHeight}.`);
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))};
}

// Fill the box (never enlarging) and crop what overflows, centred: returns the output size and the
// region of the source it shows. A source smaller than the box on both sides is left uncropped.
export function coverCrop(width: number, height: number, maxWidth: number, maxHeight: number = maxWidth): {size: Size; crop: Size & {x: number; y: number}} {
    if (!(width > 0 && height > 0)) throw new Error(`Invalid image size ${width}×${height}.`);
    if (!(maxWidth > 0 && maxHeight > 0)) throw new Error(`Invalid bounds ${maxWidth}×${maxHeight}.`);
    const scale = Math.min(1, Math.max(maxWidth / width, maxHeight / height));
    const size = {width: Math.max(1, Math.min(maxWidth, Math.round(width * scale))), height: Math.max(1, Math.min(maxHeight, Math.round(height * scale)))};
    const cropWidth = Math.min(width, size.width / scale);
    const cropHeight = Math.min(height, size.height / scale);
    return {size, crop: {x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight}};
}

// A single big downscale in canvas aliases (thin lines shimmer), so halve repeatedly until within
// 2× of the target, then do the final step. Returns the intermediate sizes, target last.
export function downscaleSteps(from: Size, to: Size): Size[] {
    const steps: Size[] = [];
    let {width, height} = from;
    while (width / 2 >= to.width && height / 2 >= to.height && (width > to.width * 2 || height > to.height * 2)) {
        width = Math.round(width / 2);
        height = Math.round(height / 2);
        steps.push({width, height});
    }
    const last = steps[steps.length - 1];
    if (!last || last.width !== to.width || last.height !== to.height) steps.push(to);
    return steps;
}

export function extensionFor(type: string): ResizedImage["ext"] {
    if (type === WEBP) return "webp";
    if (type === "image/png") return "png";
    if (type === "image/jpeg") return "jpg";
    throw new Error(`Unexpected encoded type "${type}".`);
}

function createCanvas({width, height}: Size): AnyCanvas {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function draw(source: Drawable, size: Size, crop?: Size & {x: number; y: number}): AnyCanvas {
    const canvas = createCanvas(size);
    const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    if (!context) throw new Error("Canvas 2D is not available.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    if (crop) context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height);
    else context.drawImage(source, 0, 0, size.width, size.height);
    return canvas;
}

function encode(canvas: AnyCanvas, quality: number): Promise<Blob> {
    if ("convertToBlob" in canvas) return canvas.convertToBlob({type: WEBP, quality});
    return new Promise((resolve, reject) =>
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed."))), WEBP, quality));
}

// Decode once, produce every variant. Browsers without a WebP encoder (older Safari) return PNG;
// check `ext` rather than assuming "webp".
export async function resizeImageVariants(file: Blob, variants: ResizeVariant[]): Promise<ResizedImage[]> {
    const bitmap = await createImageBitmap(file, {imageOrientation: "from-image"});
    try {
        const results: ResizedImage[] = [];
        for (const variant of variants) {
            let source: Drawable = bitmap;
            let target: Size;
            if (variant.fit === "cover") {
                // Crop at full resolution first, then downscale the crop like any other variant.
                const {size, crop} = coverCrop(bitmap.width, bitmap.height, variant.maxWidth, variant.maxHeight);
                const cropped = draw(bitmap, {width: Math.round(crop.width), height: Math.round(crop.height)}, crop);
                source = cropped as Drawable;
                target = size;
            } else {
                target = fitWithin(bitmap.width, bitmap.height, variant.maxWidth, variant.maxHeight);
            }
            const [first, ...rest] = downscaleSteps(source, target);
            let canvas = draw(source, first);
            for (const step of rest) canvas = draw(canvas, step);
            const blob = await encode(canvas, variant.quality ?? 0.8);
            results.push({name: variant.name, blob, ...target, type: blob.type, ext: extensionFor(blob.type)});
        }
        return results;
    } finally {
        bitmap.close();
    }
}

export async function resizeImage(file: Blob, variant: Omit<ResizeVariant, "name">): Promise<ResizedImage> {
    const [result] = await resizeImageVariants(file, [{name: "image", ...variant}]);
    return result;
}
