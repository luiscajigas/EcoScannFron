import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { TimeoutError } from 'rxjs';
import { en, es, TranslationKey } from '../i18n/translations';
import { ApiError, BinColor, CategoryKey, ErrorCode } from '../models/models';
import { safeStorage } from './storage';

const LANGUAGE_KEY = 'ecoscan_language';
const SERVER_DOWN_STATUSES = [0, 502, 503, 504];

// These Records are exhaustive: if the contract adds a value, the build fails until it is translated.
const CATEGORIES: Record<CategoryKey, { name: TranslationKey; instructions: TranslationKey }> = {
  organic: { name: 'categoryOrganic', instructions: 'categoryOrganicInstructions' },
  paper_cardboard: { name: 'categoryPaper', instructions: 'categoryPaperInstructions' },
  plastic: { name: 'categoryPlastic', instructions: 'categoryPlasticInstructions' },
  glass: { name: 'categoryGlass', instructions: 'categoryGlassInstructions' },
  metal: { name: 'categoryMetal', instructions: 'categoryMetalInstructions' },
  non_recyclable: { name: 'categoryOther', instructions: 'categoryOtherInstructions' }
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

const BINS: Record<BinColor, TranslationKey> = {
  green: 'containerGreen',
  blue: 'containerBlue',
  white: 'containerWhite',
  black: 'containerBlack'
};

const API_ERRORS: Record<ErrorCode, TranslationKey> = {
  INVALID_DATA: 'apiInvalidData',
  NOT_AUTHENTICATED: 'apiMissingToken',
  INVALID_TOKEN: 'apiInvalidToken',
  INVALID_CREDENTIALS: 'apiInvalidCredentials',
  EMAIL_IN_USE: 'apiAccountExists',
  UNKNOWN_CATEGORY: 'apiCategoryUnknown',
  USER_NOT_FOUND: 'apiUserNotFound',
  ROUTE_NOT_FOUND: 'apiRouteNotFound',
  IMAGE_TOO_LARGE: 'apiImageTooLarge',
  TOO_MANY_ATTEMPTS: 'apiTooManyAttempts',
  INTERNAL_ERROR: 'apiInternal'
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly current = signal<'es' | 'en'>('es');

  constructor() {
    if (safeStorage.read(LANGUAGE_KEY) === 'en') {
      this.current.set('en');
    }
    this.applyLanguage();
  }

  t(key: TranslationKey): string {
    return this.current() === 'en' ? en[key] : es[key];
  }

  toggle(): void {
    this.current.update((language) => (language === 'es' ? 'en' : 'es'));
    safeStorage.write(LANGUAGE_KEY, this.current());
    this.applyLanguage();
  }

  categoryName(key: CategoryKey): string {
    return this.t(CATEGORIES[key].name);
  }

  categoryInstructions(key: CategoryKey): string {
    return this.t(CATEGORIES[key].instructions);
  }

  binName(color: BinColor): string {
    return this.t(BINS[color]);
  }

  /** Date and time of a scan, in the user's own time zone. */
  formatDateTime(isoDate: string): string {
    return new Intl.DateTimeFormat(this.current(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoDate));
  }

  /** Long name of a calendar day (YYYY-MM-DD), which has no time zone of its own. */
  formatDay(date: string): string {
    return this.formatCalendarDate(date, { weekday: 'long', day: 'numeric', month: 'short' });
  }

  formatWeekday(date: string): string {
    return this.formatCalendarDate(date, { weekday: 'short' });
  }

  /** Turns an HTTP error into a message for the user, in the current language. */
  httpError(err: unknown, fallback: TranslationKey): string {
    if (err instanceof TimeoutError) return this.t('serverUnavailable');
    if (!(err instanceof HttpErrorResponse)) return this.t(fallback);
    if (SERVER_DOWN_STATUSES.includes(err.status)) return this.t('serverUnavailable');

    const code = (err.error as Partial<ApiError> | null)?.code;
    return this.t(code && API_ERRORS[code] ? API_ERRORS[code] : fallback);
  }

  private formatCalendarDate(date: string, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.current(), { ...options, timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  }

  private applyLanguage(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.current();
    }
  }
}
