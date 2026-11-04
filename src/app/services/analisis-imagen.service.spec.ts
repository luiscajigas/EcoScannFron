import { fakeAsync, tick } from '@angular/core/testing';
import { RespuestaAnalisis, ResultadoAnalisis, SolicitudAnalisis } from '../workers/analisis.mensajes';
import { AnalisisImagenService, ErrorAnalisis } from './analisis-imagen.service';

class WorkerFalso {
  static instancias: WorkerFalso[] = [];
  onmessage: ((evento: { data: RespuestaAnalisis }) => void) | null = null;
  onerror: (() => void) | null = null;
  enviados: SolicitudAnalisis[] = [];
  terminado = false;

  constructor() {
    WorkerFalso.instancias.push(this);
  }

  postMessage(mensaje: SolicitudAnalisis): void {
    this.enviados.push(mensaje);
  }

  terminate(): void {
    this.terminado = true;
  }
}

const RESULTADO: ResultadoAnalisis = {
  categoriaClave: 'plastico',
  confianza: 0.6,
  anchoPx: 10,
  altoPx: 10,
  imagenComprimidaBase64: 'data:image/jpeg;base64,AAAA'
};

describe('AnalisisImagenService', () => {
  const global = globalThis as unknown as { Worker: unknown };
  const workerReal = global.Worker;
  let servicio: AnalisisImagenService;

  beforeEach(() => {
    WorkerFalso.instancias = [];
    global.Worker = WorkerFalso;
    servicio = new AnalisisImagenService();
  });

  afterEach(() => {
    servicio.ngOnDestroy();
    global.Worker = workerReal;
  });

  const ultimoWorker = () => WorkerFalso.instancias[WorkerFalso.instancias.length - 1];

  it('resuelve cada análisis con la respuesta de su mismo id', async () => {
    const primero = servicio.analizar(new Blob());
    const segundo = servicio.analizar(new Blob());
    const worker = ultimoWorker();
    const [idPrimero, idSegundo] = worker.enviados.map((m) => m.id);

    worker.onmessage!({ data: { id: idSegundo, ok: true, resultado: { ...RESULTADO, anchoPx: 2 } } });
    worker.onmessage!({ data: { id: idPrimero, ok: true, resultado: { ...RESULTADO, anchoPx: 1 } } });

    expect((await primero).anchoPx).toBe(1);
    expect((await segundo).anchoPx).toBe(2);
  });

  it('reutiliza el mismo hilo entre análisis', async () => {
    const analisis = servicio.analizar(new Blob());
    const worker = ultimoWorker();
    worker.onmessage!({ data: { id: worker.enviados[0].id, ok: true, resultado: RESULTADO } });
    await analisis;

    servicio.analizar(new Blob()).catch(() => undefined);
    expect(WorkerFalso.instancias.length).toBe(1);
  });

  it('rechaza si la imagen no se pudo procesar', async () => {
    const analisis = servicio.analizar(new Blob());
    const worker = ultimoWorker();
    worker.onmessage!({ data: { id: worker.enviados[0].id, ok: false, error: 'formato no válido' } });

    const error = await analisis.catch((e) => e);
    expect(error).toBeInstanceOf(ErrorAnalisis);
    expect(error.motivo).toBe('imagen-invalida');
    expect(error.message).toBe('formato no válido');
  });

  it('si el hilo se cae, rechaza y el siguiente análisis crea otro', async () => {
    const analisis = servicio.analizar(new Blob());
    const caido = ultimoWorker();
    caido.onerror!();

    expect((await analisis.catch((e) => e)).motivo).toBe('worker-caido');
    expect(caido.terminado).toBeTrue();

    servicio.analizar(new Blob()).catch(() => undefined);
    expect(WorkerFalso.instancias.length).toBe(2);
  });

  it('no se queda esperando si el hilo nunca responde', fakeAsync(() => {
    let motivo = '';
    servicio.analizar(new Blob()).catch((e) => (motivo = e.motivo));

    tick(30000);

    expect(motivo).toBe('tiempo-agotado');
    expect(ultimoWorker().terminado).toBeTrue();
  }));

  it('termina el hilo al destruirse', async () => {
    const analisis = servicio.analizar(new Blob());
    const worker = ultimoWorker();
    servicio.ngOnDestroy();

    await analisis.catch(() => undefined);
    expect(worker.terminado).toBeTrue();
  });

  it('rechaza si el navegador no soporta Workers', async () => {
    global.Worker = undefined;
    const error = await new AnalisisImagenService().analizar(new Blob()).catch((e) => e);
    expect(error.motivo).toBe('sin-soporte');
  });
});
