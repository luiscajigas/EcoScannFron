/// <reference lib="webworker" />

/**
 * Este worker recibe la foto tomada/seleccionada por el usuario y, en un
 * hilo separado del principal (para no congelar la cámara/interfaz
 * mientras se procesa una imagen pesada), hace dos cosas:
 *
 * 1. La REDIMENSIONA y COMPRIME (para no subir fotos de varios MB al
 *    backend).
 * 2. Calcula una CLASIFICACIÓN HEURÍSTICA simple por color dominante.
 *    Esto NO es IA real -es un reemplazo temporal y declarado como tal-
 *    para tener una beta funcional de principio a fin. El punto exacto
 *    donde se conectará un modelo de visión real está marcado en el
 *    backend (TODO fase IA).
 */

interface MensajeEntrada {
  archivo: Blob;
}

interface ResultadoAnalisis {
  categoriaClave: string;
  confianza: number;
  anchoPx: number;
  altoPx: number;
  imagenComprimidaBase64: string;
}

const LADO_MAXIMO = 480;

function clasificarPorColor(r: number, g: number, b: number): { clave: string; confianza: number } {
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

addEventListener('message', async ({ data }: { data: MensajeEntrada }) => {
  try {
    const bitmap = await createImageBitmap(data.archivo);

    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = new OffscreenCanvas(ancho, alto);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const { data: pixeles } = ctx.getImageData(0, 0, ancho, alto);
    let rTotal = 0, gTotal = 0, bTotal = 0;
    const totalPixeles = pixeles.length / 4;

    for (let i = 0; i < pixeles.length; i += 4) {
      rTotal += pixeles[i];
      gTotal += pixeles[i + 1];
      bTotal += pixeles[i + 2];
    }

    const rProm = rTotal / totalPixeles;
    const gProm = gTotal / totalPixeles;
    const bProm = bTotal / totalPixeles;

    const clasificacion = clasificarPorColor(rProm, gProm, bProm);

    const blobComprimido = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
    const reader = new FileReaderSync();
    const dataUrl = reader.readAsDataURL(blobComprimido);

    const resultado: ResultadoAnalisis = {
      categoriaClave: clasificacion.clave,
      confianza: clasificacion.confianza,
      anchoPx: ancho,
      altoPx: alto,
      imagenComprimidaBase64: dataUrl
    };

    postMessage({ ok: true, resultado });
  } catch (err) {
    postMessage({ ok: false, error: (err as Error).message });
  }
});
