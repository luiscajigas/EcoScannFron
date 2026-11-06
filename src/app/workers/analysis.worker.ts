/// <reference lib="webworker" />

import { AnalysisRequest, AnalysisResponse, AnalysisResult } from './analysis.messages';
import { averageColor, classifyByColor } from './classify-color';

/**
 * Runs on a separate thread so a heavy photo does not freeze the interface. It
 * resizes and compresses the image, and computes the fallback heuristic. The
 * compressed photo travels to the backend, which is the one that queries the AI.
 */

const MAX_SIDE = 768;
const JPEG_QUALITY = 0.7;
const THUMBNAIL_SIDE = 96;
const THUMBNAIL_QUALITY = 0.6;

const toDataUrl = (blob: Blob): string => new FileReaderSync().readAsDataURL(blob);

/** Square crop from the center: only this small copy is stored with the scan. */
async function createThumbnail(bitmap: ImageBitmap): Promise<string> {
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = new OffscreenCanvas(THUMBNAIL_SIDE, THUMBNAIL_SIDE);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The browser did not allow creating the canvas.');
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    THUMBNAIL_SIDE,
    THUMBNAIL_SIDE
  );
  return toDataUrl(await canvas.convertToBlob({ type: 'image/jpeg', quality: THUMBNAIL_QUALITY }));
}

async function analyze(file: Blob): Promise<AnalysisResult> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The browser did not allow creating the canvas.');
    context.drawImage(bitmap, 0, 0, width, height);

    const { r, g, b } = averageColor(context.getImageData(0, 0, width, height).data);
    const { key, confidence } = classifyByColor(r, g, b);

    const compressed = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });

    return {
      categoryKey: key,
      confidence,
      widthPx: width,
      heightPx: height,
      compressedImageBase64: toDataUrl(compressed),
      thumbnailBase64: await createThumbnail(bitmap)
    };
  } finally {
    // The bitmap uses memory outside the garbage collector, so it must be released by hand.
    bitmap.close();
  }
}

function respond(response: AnalysisResponse): void {
  postMessage(response);
}

addEventListener('message', async ({ data }: MessageEvent<AnalysisRequest>) => {
  try {
    respond({ id: data.id, ok: true, result: await analyze(data.file) });
  } catch (err) {
    respond({ id: data.id, ok: false, error: (err as Error).message });
  }
});
