import { TestBed } from '@angular/core/testing';
import { ResultadoEscaneo } from '../../models/models';
import { ResultadoEscaneoComponent } from './resultado-escaneo.component';

const RESULTADO: ResultadoEscaneo = {
  id: 1,
  categoria: { clave: 'plastico', nombre: 'Plástico', instrucciones: 'x', color_contenedor: 'blanco' },
  origen: 'ia',
  confianza: 0.9,
  puntosOtorgados: 15,
  puntosTotales: 30
};

describe('ResultadoEscaneoComponent', () => {
  function mostrar(resultado: ResultadoEscaneo): HTMLElement {
    const fixture = TestBed.createComponent(ResultadoEscaneoComponent);
    fixture.componentRef.setInput('resultado', resultado);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => localStorage.clear());

  it('muestra la categoría, el contenedor y los puntos', () => {
    const vista = mostrar(RESULTADO);
    expect(vista.querySelector('h2')?.textContent).toContain('Plástico');
    expect(vista.querySelector('.contenedor--blanco')).not.toBeNull();
    expect(vista.querySelector('.puntos')?.textContent).toContain('30');
  });

  it('no muestra el aviso si clasificó la IA', () => {
    expect(mostrar(RESULTADO).querySelector('.aviso-ia')).toBeNull();
  });

  it('avisa si se usó la heurística', () => {
    expect(mostrar({ ...RESULTADO, origen: 'heuristica' }).querySelector('.aviso-ia')).not.toBeNull();
  });
});
