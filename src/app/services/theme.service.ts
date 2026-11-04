import { Injectable, signal } from '@angular/core';
import { almacenamiento } from './almacenamiento';

const CLAVE_TEMA = 'ecoscan_tema';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly modoClaro = signal(false);

  constructor() {
    if (almacenamiento.leer(CLAVE_TEMA) === 'claro') {
      this.modoClaro.set(true);
    }
    this.aplicarTema();
  }

  alternar(): void {
    this.modoClaro.update((claro) => !claro);
    almacenamiento.guardar(CLAVE_TEMA, this.modoClaro() ? 'claro' : 'oscuro');
    this.aplicarTema();
  }

  private aplicarTema(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['theme'] = this.modoClaro() ? 'light' : 'dark';
    }
  }
}
