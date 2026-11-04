import { Injectable, signal } from '@angular/core';
import { safeStorage } from './storage';

const THEME_KEY = 'ecoscan_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isLight = signal(false);

  constructor() {
    if (safeStorage.read(THEME_KEY) === 'light') {
      this.isLight.set(true);
    }
    this.applyTheme();
  }

  toggle(): void {
    this.isLight.update((isLight) => !isLight);
    safeStorage.write(THEME_KEY, this.isLight() ? 'light' : 'dark');
    this.applyTheme();
  }

  private applyTheme(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['theme'] = this.isLight() ? 'light' : 'dark';
    }
  }
}
