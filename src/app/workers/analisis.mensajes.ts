import { CategoriaClave } from '../models/models';

/**
 * Contrato entre el hilo principal y el Web Worker. El `id` relaciona cada
 * respuesta con su solicitud, porque postMessage no tiene valor de retorno.
 */
export interface SolicitudAnalisis {
  id: number;
  archivo: Blob;
}

export interface ResultadoAnalisis {
  categoriaClave: CategoriaClave;
  confianza: number;
  anchoPx: number;
  altoPx: number;
  imagenComprimidaBase64: string;
}

export type RespuestaAnalisis =
  | { id: number; ok: true; resultado: ResultadoAnalisis }
  | { id: number; ok: false; error: string };
