import { CategoryKey } from '../models/models';

/**
 * Contract between the main thread and the Web Worker. The `id` links each
 * response to its request, because postMessage has no return value.
 */
export interface AnalysisRequest {
  id: number;
  file: Blob;
}

export interface AnalysisResult {
  categoryKey: CategoryKey;
  confidence: number;
  widthPx: number;
  heightPx: number;
  compressedImageBase64: string;
}

export type AnalysisResponse =
  | { id: number; ok: true; result: AnalysisResult }
  | { id: number; ok: false; error: string };
