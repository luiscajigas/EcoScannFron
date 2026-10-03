export interface Categoria {
  clave: string;
  nombre: string;
  instrucciones: string;
  color_contenedor: string;
  puntos: number;
}

export interface Escaneo {
  id: number;
  categoria_clave: string;
  categoria_nombre: string;
  instrucciones: string;
  color_contenedor: string;
  confianza: number;
  origen: 'heuristica' | 'ia';
  puntos_otorgados: number;
  creado_en: string;
}

export interface ResultadoEscaneo {
  id: number;
  categoria: {
    clave: string;
    nombre: string;
    instrucciones: string;
    color_contenedor: string;
  };
  origen: string;
  puntosOtorgados: number;
  puntosTotales: number;
  avisoIA: string;
}

export interface ResultadoWorker {
  categoriaClave: string;
  confianza: number;
  anchoPx: number;
  altoPx: number;
  imagenComprimidaBase64: string;
}
