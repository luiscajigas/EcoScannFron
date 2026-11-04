import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { TimeoutError } from 'rxjs';
import { en, es, TranslationKey } from '../i18n/traducciones';
import { CategoriaClave, CodigoError, ColorContenedor, ErrorApi } from '../models/models';
import { almacenamiento } from './almacenamiento';

const CLAVE_IDIOMA = 'ecoscan_idioma';
const ESTADOS_SIN_SERVIDOR = [0, 502, 503, 504];

// Estos Record son exhaustivos: si el contrato agrega un valor, el build falla hasta traducirlo.
const CATEGORIAS: Record<CategoriaClave, { name: TranslationKey; instructions: TranslationKey }> = {
  organico: { name: 'categoryOrganic', instructions: 'categoryOrganicInstructions' },
  papel_carton: { name: 'categoryPaper', instructions: 'categoryPaperInstructions' },
  plastico: { name: 'categoryPlastic', instructions: 'categoryPlasticInstructions' },
  vidrio: { name: 'categoryGlass', instructions: 'categoryGlassInstructions' },
  metal: { name: 'categoryMetal', instructions: 'categoryMetalInstructions' },
  no_reciclable: { name: 'categoryOther', instructions: 'categoryOtherInstructions' }
};

const CONTENEDORES: Record<ColorContenedor, TranslationKey> = {
  verde: 'containerGreen',
  azul: 'containerBlue',
  blanco: 'containerWhite',
  negro: 'containerBlack'
};

const ERRORES_API: Record<CodigoError, TranslationKey> = {
  DATOS_INVALIDOS: 'apiInvalidData',
  NO_AUTENTICADO: 'apiMissingToken',
  TOKEN_INVALIDO: 'apiInvalidToken',
  CREDENCIALES_INVALIDAS: 'apiInvalidCredentials',
  CORREO_EN_USO: 'apiAccountExists',
  CATEGORIA_DESCONOCIDA: 'apiCategoryUnknown',
  USUARIO_NO_ENCONTRADO: 'apiUserNotFound',
  RUTA_NO_ENCONTRADA: 'apiRouteNotFound',
  IMAGEN_DEMASIADO_GRANDE: 'apiImageTooLarge',
  DEMASIADOS_INTENTOS: 'apiTooManyAttempts',
  ERROR_INTERNO: 'apiInternal'
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<'es' | 'en'>('es');

  constructor() {
    if (almacenamiento.leer(CLAVE_IDIOMA) === 'en') {
      this.language.set('en');
    }
    this.applyLanguage();
  }

  t(key: TranslationKey): string {
    return this.language() === 'en' ? en[key] : es[key];
  }

  toggle(): void {
    this.language.update((language) => (language === 'es' ? 'en' : 'es'));
    almacenamiento.guardar(CLAVE_IDIOMA, this.language());
    this.applyLanguage();
  }

  categoryName(clave: CategoriaClave): string {
    return this.t(CATEGORIAS[clave].name);
  }

  categoryInstructions(clave: CategoriaClave): string {
    return this.t(CATEGORIAS[clave].instructions);
  }

  containerName(color: ColorContenedor): string {
    return this.t(CONTENEDORES[color]);
  }

  /** Convierte un error HTTP en un mensaje para el usuario, en el idioma actual. */
  errorHttp(err: unknown, fallback: TranslationKey): string {
    if (err instanceof TimeoutError) return this.t('serverUnavailable');
    if (!(err instanceof HttpErrorResponse)) return this.t(fallback);
    if (ESTADOS_SIN_SERVIDOR.includes(err.status)) return this.t('serverUnavailable');

    const codigo = (err.error as Partial<ErrorApi> | null)?.codigo;
    return this.t(codigo && ERRORES_API[codigo] ? ERRORES_API[codigo] : fallback);
  }

  private applyLanguage(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.language();
    }
  }
}
