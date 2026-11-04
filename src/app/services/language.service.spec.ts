import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TimeoutError } from 'rxjs';
import { en, es } from '../i18n/translations';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let language: LanguageService;

  const errorWithCode = (status: number, code?: string) =>
    new HttpErrorResponse({ status, error: code ? { error: 'x', code } : null });

  beforeEach(() => {
    localStorage.clear();
    language = TestBed.inject(LanguageService);
  });
  afterEach(() => localStorage.clear());

  it('both languages have the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('switches language and remembers it', () => {
    expect(language.t('signOut')).toBe(es.signOut);
    language.toggle();
    expect(language.t('signOut')).toBe(en.signOut);
    expect(localStorage.getItem('ecoscan_language')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    language.toggle();
  });

  it('translates errors from the API code', () => {
    expect(language.httpError(errorWithCode(401, 'INVALID_CREDENTIALS'), 'loginError')).toBe(es.apiInvalidCredentials);
    language.toggle();
    expect(language.httpError(errorWithCode(401, 'INVALID_CREDENTIALS'), 'loginError')).toBe(en.apiInvalidCredentials);
    language.toggle();
  });

  it('uses the fallback message if the code is missing or unknown', () => {
    expect(language.httpError(errorWithCode(500), 'loginError')).toBe(es.loginError);
    expect(language.httpError(errorWithCode(500, 'NEW_CODE'), 'loginError')).toBe(es.loginError);
    expect(language.httpError(new Error('something else'), 'loginError')).toBe(es.loginError);
  });

  it('warns that the server is unavailable', () => {
    for (const status of [0, 502, 503, 504]) {
      expect(language.httpError(errorWithCode(status), 'loginError')).toBe(es.serverUnavailable);
    }
    expect(language.httpError(new TimeoutError(), 'loginError')).toBe(es.serverUnavailable);
  });
});
