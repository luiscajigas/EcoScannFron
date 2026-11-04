import { averageColor, classifyByColor, ColorClassification } from './classify-color';

describe('classifyByColor', () => {
  const cases: [string, [number, number, number], ColorClassification['key']][] = [
    ['light and colorless', [240, 240, 240], 'glass'],
    ['mostly green', [60, 160, 60], 'organic'],
    ['brown tone', [170, 130, 90], 'paper_cardboard'],
    ['dark gray', [100, 100, 100], 'metal'],
    ['saturated color', [40, 80, 220], 'plastic'],
    ['medium gray with some tone', [170, 170, 190], 'non_recyclable']
  ];

  for (const [name, [r, g, b], expected] of cases) {
    it(`classifies ${name} as ${expected}`, () => {
      expect(classifyByColor(r, g, b).key).toBe(expected);
    });
  }

  it('returns a confidence between 0 and 1', () => {
    for (const [, [r, g, b]] of cases) {
      const { confidence } = classifyByColor(r, g, b);
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe('averageColor', () => {
  it('averages each channel and ignores alpha', () => {
    const pixels = new Uint8ClampedArray([10, 20, 30, 255, 30, 40, 50, 0]);
    expect(averageColor(pixels)).toEqual({ r: 20, g: 30, b: 40 });
  });
});
