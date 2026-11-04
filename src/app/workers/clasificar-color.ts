import { CategoriaClave } from '../models/models';

export interface ClasificacionColor {
  clave: CategoriaClave;
  confianza: number;
}

/**
 * Heurística simple por color promedio. Es solo el respaldo que usa el backend
 * si la IA no está disponible. Es una función pura para poder probarla sin Worker.
 */
export function clasificarPorColor(r: number, g: number, b: number): ClasificacionColor {
  const brillo = (r + g + b) / 3;
  const saturacion = Math.max(r, g, b) - Math.min(r, g, b);

  if (brillo > 200 && saturacion < 20) {
    return { clave: 'vidrio', confianza: 0.5 };
  }
  if (g > r + 15 && g > b + 15) {
    return { clave: 'organico', confianza: 0.6 };
  }
  if (r > g && g > b && r - b > 30 && brillo > 80 && brillo < 190) {
    return { clave: 'papel_carton', confianza: 0.55 };
  }
  if (saturacion < 15 && brillo <= 150) {
    return { clave: 'metal', confianza: 0.5 };
  }
  if (saturacion > 60) {
    return { clave: 'plastico', confianza: 0.6 };
  }
  return { clave: 'no_reciclable', confianza: 0.4 };
}

/** Promedia los canales de un arreglo RGBA como el que entrega getImageData. */
export function colorPromedio(pixeles: Uint8ClampedArray): { r: number; g: number; b: number } {
  const total = pixeles.length / 4;
  let r = 0;
  let g = 0;
  let b = 0;

  for (let i = 0; i < pixeles.length; i += 4) {
    r += pixeles[i];
    g += pixeles[i + 1];
    b += pixeles[i + 2];
  }

  return { r: r / total, g: g / total, b: b / total };
}
