import { CategoryKey } from '../models/models';

export interface ColorClassification {
  key: CategoryKey;
  confidence: number;
}

/**
 * Simple heuristic based on the average color. It is only the fallback the
 * backend uses when AI is unavailable. It is a pure function so it can be tested
 * without a Worker.
 */
export function classifyByColor(r: number, g: number, b: number): ColorClassification {
  const brightness = (r + g + b) / 3;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);

  if (brightness > 200 && saturation < 20) {
    return { key: 'glass', confidence: 0.5 };
  }
  if (g > r + 15 && g > b + 15) {
    return { key: 'organic', confidence: 0.6 };
  }
  if (r > g && g > b && r - b > 30 && brightness > 80 && brightness < 190) {
    return { key: 'paper_cardboard', confidence: 0.55 };
  }
  if (saturation < 15 && brightness <= 150) {
    return { key: 'metal', confidence: 0.5 };
  }
  if (saturation > 60) {
    return { key: 'plastic', confidence: 0.6 };
  }
  return { key: 'non_recyclable', confidence: 0.4 };
}

/** Averages the channels of an RGBA array like the one getImageData returns. */
export function averageColor(pixels: Uint8ClampedArray): { r: number; g: number; b: number } {
  const total = pixels.length / 4;
  let r = 0;
  let g = 0;
  let b = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
  }

  return { r: r / total, g: g / total, b: b / total };
}
