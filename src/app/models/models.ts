import { components } from '../api/contrato';

/**
 * Tipos de la API. Todos salen del contrato OpenAPI del backend: no se escriben
 * a mano, para que el compilador avise si la API cambia.
 */
type Esquemas = components['schemas'];

export type CategoriaClave = Esquemas['CategoriaClave'];
export type CodigoError = Esquemas['CodigoError'];
export type ColorContenedor = Esquemas['ColorContenedor'];
export type ErrorApi = Esquemas['ErrorApi'];
export type Escaneo = Esquemas['Escaneo'];
export type RespuestaAuth = Esquemas['RespuestaAuth'];
export type ResultadoEscaneo = Esquemas['ResultadoEscaneo'];
export type SolicitudEscaneo = Esquemas['SolicitudEscaneo'];
export type SolicitudLogin = Esquemas['SolicitudLogin'];
export type SolicitudRegistro = Esquemas['SolicitudRegistro'];
export type Usuario = Esquemas['Usuario'];
