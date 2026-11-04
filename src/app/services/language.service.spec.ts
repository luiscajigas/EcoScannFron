import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TimeoutError } from 'rxjs';
import { en, es } from '../i18n/traducciones';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let idioma: LanguageService;

  const errorConCodigo = (status: number, codigo?: string) =>
    new HttpErrorResponse({ status, error: codigo ? { error: 'x', codigo } : null });

  beforeEach(() => {
    localStorage.clear();
    idioma = TestBed.inject(LanguageService);
  });
  afterEach(() => localStorage.clear());

  it('los dos idiomas tienen las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('cambia de idioma y lo recuerda', () => {
    expect(idioma.t('signOut')).toBe(es.signOut);
    idioma.toggle();
    expect(idioma.t('signOut')).toBe(en.signOut);
    expect(localStorage.getItem('ecoscan_idioma')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    idioma.toggle();
  });

  it('traduce los errores a partir del código de la API', () => {
    expect(idioma.errorHttp(errorConCodigo(401, 'CREDENCIALES_INVALIDAS'), 'loginError')).toBe(es.apiInvalidCredentials);
    idioma.toggle();
    expect(idioma.errorHttp(errorConCodigo(401, 'CREDENCIALES_INVALIDAS'), 'loginError')).toBe(en.apiInvalidCredentials);
    idioma.toggle();
  });

  it('usa el mensaje de respaldo si no hay código o es desconocido', () => {
    expect(idioma.errorHttp(errorConCodigo(500), 'loginError')).toBe(es.loginError);
    expect(idioma.errorHttp(errorConCodigo(500, 'CODIGO_NUEVO'), 'loginError')).toBe(es.loginError);
    expect(idioma.errorHttp(new Error('otra cosa'), 'loginError')).toBe(es.loginError);
  });

  it('avisa que el servidor no está disponible', () => {
    for (const status of [0, 502, 503, 504]) {
      expect(idioma.errorHttp(errorConCodigo(status), 'loginError')).toBe(es.serverUnavailable);
    }
    expect(idioma.errorHttp(new TimeoutError(), 'loginError')).toBe(es.serverUnavailable);
  });
});
