/// <reference lib="webworker" />

import { RespuestaAnalisis, ResultadoAnalisis, SolicitudAnalisis } from './analisis.mensajes';
import { clasificarPorColor, colorPromedio } from './clasificar-color';

/**
 * Corre en un hilo separado para que una foto pesada no congele la interfaz.
 * Reduce y comprime la imagen, y calcula la clasificación heurística de respaldo.
 * La foto comprimida viaja al backend, que es quien consulta la IA.
 */

const LADO_MAXIMO = 768;
const CALIDAD_JPEG = 0.7;

async function analizar(archivo: Blob): Promise<ResultadoAnalisis> {
  const bitmap = await createImageBitmap(archivo);
  try {
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = new OffscreenCanvas(ancho, alto);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('El navegador no permitió crear el lienzo.');
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const { r, g, b } = colorPromedio(ctx.getImageData(0, 0, ancho, alto).data);
    const { clave, confianza } = clasificarPorColor(r, g, b);

    const comprimida = await canvas.convertToBlob({ type: 'image/jpeg', quality: CALIDAD_JPEG });

    return {
      categoriaClave: clave,
      confianza,
      anchoPx: ancho,
      altoPx: alto,
      imagenComprimidaBase64: new FileReaderSync().readAsDataURL(comprimida)
    };
  } finally {
    // El bitmap ocupa memoria fuera del recolector de basura: hay que liberarlo a mano.
    bitmap.close();
  }
}

function responder(respuesta: RespuestaAnalisis): void {
  postMessage(respuesta);
}

addEventListener('message', async ({ data }: MessageEvent<SolicitudAnalisis>) => {
  try {
    responder({ id: data.id, ok: true, resultado: await analizar(data.archivo) });
  } catch (err) {
    responder({ id: data.id, ok: false, error: (err as Error).message });
  }
});
