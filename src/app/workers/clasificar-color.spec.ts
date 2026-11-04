import { clasificarPorColor, colorPromedio } from './clasificar-color';

describe('clasificarPorColor', () => {
  const casos: [string, [number, number, number], string][] = [
    ['claro y sin color', [240, 240, 240], 'vidrio'],
    ['predomina el verde', [60, 160, 60], 'organico'],
    ['tono marrón', [170, 130, 90], 'papel_carton'],
    ['gris oscuro', [100, 100, 100], 'metal'],
    ['color saturado', [40, 80, 220], 'plastico'],
    ['gris medio con algo de tono', [170, 170, 190], 'no_reciclable']
  ];

  for (const [nombre, [r, g, b], esperada] of casos) {
    it(`clasifica ${nombre} como ${esperada}`, () => {
      expect(clasificarPorColor(r, g, b).clave).toBe(esperada as ReturnType<typeof clasificarPorColor>['clave']);
    });
  }

  it('devuelve una confianza entre 0 y 1', () => {
    for (const [, [r, g, b]] of casos) {
      const { confianza } = clasificarPorColor(r, g, b);
      expect(confianza).toBeGreaterThan(0);
      expect(confianza).toBeLessThanOrEqual(1);
    }
  });
});

describe('colorPromedio', () => {
  it('promedia cada canal e ignora el alfa', () => {
    const pixeles = new Uint8ClampedArray([10, 20, 30, 255, 30, 40, 50, 0]);
    expect(colorPromedio(pixeles)).toEqual({ r: 20, g: 30, b: 40 });
  });
});
