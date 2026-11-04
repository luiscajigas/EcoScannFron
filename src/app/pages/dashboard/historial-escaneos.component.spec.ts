import { TestBed } from '@angular/core/testing';
import { Escaneo } from '../../models/models';
import { HistorialEscaneosComponent } from './historial-escaneos.component';

const ESCANEO: Escaneo = {
  id: 1,
  categoria_clave: 'metal',
  categoria_nombre: 'Metal',
  instrucciones: 'x',
  color_contenedor: 'blanco',
  confianza: 0.8,
  origen: 'ia',
  puntos_otorgados: 15,
  creado_en: '2026-11-04T00:00:00.000Z'
};

describe('HistorialEscaneosComponent', () => {
  function mostrar(escaneos: Escaneo[], cargando: boolean): HTMLElement {
    const fixture = TestBed.createComponent(HistorialEscaneosComponent);
    fixture.componentRef.setInput('escaneos', escaneos);
    fixture.componentRef.setInput('cargando', cargando);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => localStorage.clear());

  it('mientras carga no muestra la lista', () => {
    const vista = mostrar([], true);
    expect(vista.querySelector('.empty-state')?.textContent).toContain('Cargando');
    expect(vista.querySelector('ul')).toBeNull();
  });

  it('sin escaneos muestra el mensaje vacío', () => {
    const vista = mostrar([], false);
    expect(vista.querySelector('.empty-state')?.textContent).toContain('Aún no hay');
    expect(vista.querySelector('ul')).toBeNull();
  });

  it('con escaneos muestra una fila por cada uno', () => {
    const vista = mostrar([ESCANEO, { ...ESCANEO, id: 2 }], false);
    expect(vista.querySelectorAll('li').length).toBe(2);
    expect(vista.querySelector('.empty-state')).toBeNull();
    expect(vista.querySelector('.historial__count')?.textContent).toContain('2');
  });
});
