import { CategoryKey } from '../models/models';

export interface ColorClassification {
  key: CategoryKey;
  confidence: number;
}

interface ColorFeatures {
  r: number;
  g: number;
  b: number;
  brightness: number;
  saturation: number;
}

interface ColorRule extends ColorClassification {
  matches: (color: ColorFeatures) => boolean;
}

// Decision table: the first rule that matches wins, so the order matters.
const COLOR_RULES: ColorRule[] = [
  { key: 'glass', confidence: 0.5, matches: ({ brightness, saturation }) => brightness > 200 && saturation < 20 },
  { key: 'organic', confidence: 0.6, matches: ({ r, g, b }) => g > r + 15 && g > b + 15 },
  {
    key: 'paper_cardboard',
    confidence: 0.55,
    matches: ({ r, g, b, brightness }) => r > g && g > b && r - b > 30 && brightness > 80 && brightness < 190
  },
  { key: 'metal', confidence: 0.5, matches: ({ brightness, saturation }) => saturation < 15 && brightness <= 150 },
  { key: 'plastic', confidence: 0.6, matches: ({ saturation }) => saturation > 60 }
];

const DEFAULT_CLASSIFICATION: ColorClassification = { key: 'non_recyclable', confidence: 0.4 };

/**
 * Simple heuristic based on the average color. It is only the fallback the
 * backend uses when AI is unavailable. It is a pure function so it can be tested
 * without a Worker.
 */
export function classifyByColor(r: number, g: number, b: number): ColorClassification {
  const color: ColorFeatures = {
    r,
    g,
    b,
    brightness: (r + g + b) / 3,
    saturation: Math.max(r, g, b) - Math.min(r, g, b)
  };
  const rule = COLOR_RULES.find(({ matches }) => matches(color));
  return rule ? { key: rule.key, confidence: rule.confidence } : DEFAULT_CLASSIFICATION;
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
