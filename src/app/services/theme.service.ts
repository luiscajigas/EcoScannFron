import { Injectable, signal } from '@angular/core';

const CLAVE_TEMA = 'ecoscan_tema';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly modoClaro = signal(false);

  constructor() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(CLAVE_TEMA) === 'claro') {
      this.modoClaro.set(true);
    }
    this.aplicarTema();
  }

  alternar(): void {
    this.modoClaro.update((claro) => !claro);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLAVE_TEMA, this.modoClaro() ? 'claro' : 'oscuro');
    }
    this.aplicarTema();
  }

  private aplicarTema(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['theme'] = this.modoClaro() ? 'light' : 'dark';
    }
  }
}
