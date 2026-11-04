import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AnalisisImagenService, ErrorAnalisis } from '../../services/analisis-imagen.service';
import { ResultadoAnalisis } from '../../workers/analisis.mensajes';
import { DashboardComponent } from './dashboard.component';

const ANALISIS: ResultadoAnalisis = {
  categoriaClave: 'plastico',
  confianza: 0.6,
  anchoPx: 10,
  altoPx: 10,
  imagenComprimidaBase64: 'data:image/jpeg;base64,AAAA'
};

describe('DashboardComponent', () => {
  const URL_ESCANEOS = `${environment.apiUrl}/escaneos`;
  let analizar: jasmine.Spy;
  let backend: HttpTestingController;
  let componente: DashboardComponent;

  const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
  const seleccionar = (archivo: File) => {
    const target = { files: [archivo], value: 'C:\\foto.jpg' };
    return { target, listo: componente.onArchivoSeleccionado({ target } as unknown as Event) };
  };

  beforeEach(() => {
    localStorage.clear();
    analizar = jasmine.createSpy('analizar').and.resolveTo(ANALISIS);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).overrideComponent(DashboardComponent, {
      set: { providers: [{ provide: AnalisisImagenService, useValue: { analizar } }] }
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
    backend = TestBed.inject(HttpTestingController);
    backend.expectOne(URL_ESCANEOS).flush([]);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('rechaza un archivo que no es imagen sin analizarlo', async () => {
    await seleccionar(new File(['x'], 'nota.txt', { type: 'text/plain' })).listo;
    expect(analizar).not.toHaveBeenCalled();
    expect(componente.error()).toContain('no es una imagen');
    expect(componente.procesando()).toBeFalse();
  });

  it('rechaza una foto demasiado pesada', async () => {
    const pesada = foto();
    Object.defineProperty(pesada, 'size', { value: 26 * 1024 * 1024 });
    await seleccionar(pesada).listo;
    expect(analizar).not.toHaveBeenCalled();
    expect(componente.error()).toContain('25 MB');
  });

  it('limpia el selector para poder elegir la misma foto otra vez', async () => {
    analizar.and.rejectWith(new ErrorAnalisis('imagen-invalida', 'dañada'));
    const { target, listo } = seleccionar(foto());
    await listo;
    expect(target.value).toBe('');
  });

  it('muestra el error del análisis y libera la pantalla', async () => {
    analizar.and.rejectWith(new ErrorAnalisis('imagen-invalida', 'dañada'));
    await seleccionar(foto()).listo;
    expect(componente.error()).toContain('dañada');
    expect(componente.procesando()).toBeFalse();
  });

  it('avisa si el análisis tardó demasiado', async () => {
    analizar.and.rejectWith(new ErrorAnalisis('tiempo-agotado'));
    await seleccionar(foto()).listo;
    expect(componente.error()).toContain('tardó demasiado');
  });

  it('libera la vista previa anterior al elegir otra foto', async () => {
    analizar.and.rejectWith(new ErrorAnalisis('imagen-invalida', 'x'));
    const revocar = spyOn(URL, 'revokeObjectURL').and.callThrough();
    await seleccionar(foto()).listo;
    const anterior = componente.previsualizacion();
    await seleccionar(foto()).listo;
    expect(revocar).toHaveBeenCalledWith(anterior!);
  });

  it('registra el escaneo y actualiza el historial', async () => {
    await seleccionar(foto()).listo;

    const peticion = backend.expectOne(URL_ESCANEOS);
    expect(peticion.request.body.imagenBase64).toBe(ANALISIS.imagenComprimidaBase64);
    peticion.flush({
      id: 1,
      categoria: { clave: 'plastico', nombre: 'Plástico', instrucciones: 'x', color_contenedor: 'blanco' },
      origen: 'ia',
      confianza: 0.9,
      puntosOtorgados: 15,
      puntosTotales: 15
    });

    expect(componente.resultado()?.puntosTotales).toBe(15);
    expect(componente.procesando()).toBeFalse();
    backend.expectOne(URL_ESCANEOS).flush([]);
  });
});
