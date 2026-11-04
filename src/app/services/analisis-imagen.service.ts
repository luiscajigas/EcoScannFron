import { Injectable, OnDestroy } from '@angular/core';
import { RespuestaAnalisis, ResultadoAnalisis, SolicitudAnalisis } from '../workers/analisis.mensajes';

const LIMITE_ANALISIS_MS = 30000;

export type MotivoErrorAnalisis = 'sin-soporte' | 'tiempo-agotado' | 'worker-caido' | 'imagen-invalida';

export class ErrorAnalisis extends Error {
  constructor(readonly motivo: MotivoErrorAnalisis, detalle = '') {
    super(detalle);
    this.name = 'ErrorAnalisis';
  }
}

interface AnalisisPendiente {
  resolver: (resultado: ResultadoAnalisis) => void;
  rechazar: (error: ErrorAnalisis) => void;
  temporizador: ReturnType<typeof setTimeout>;
}

/**
 * Oculta el Web Worker detrás de una Promesa. Lo crea al primer uso, lo termina
 * cuando la página se destruye y lo recrea si se cae, de modo que un fallo del
 * hilo nunca deja la interfaz esperando para siempre.
 */
@Injectable()
export class AnalisisImagenService implements OnDestroy {
  private worker: Worker | null = null;
  private siguienteId = 1;
  private readonly pendientes = new Map<number, AnalisisPendiente>();

  analizar(archivo: Blob): Promise<ResultadoAnalisis> {
    return new Promise((resolver, rechazar) => {
      if (typeof Worker === 'undefined') {
        rechazar(new ErrorAnalisis('sin-soporte'));
        return;
      }

      const id = this.siguienteId++;
      const temporizador = setTimeout(
        () => this.descartarWorker(new ErrorAnalisis('tiempo-agotado')),
        LIMITE_ANALISIS_MS
      );
      this.pendientes.set(id, { resolver, rechazar, temporizador });

      const solicitud: SolicitudAnalisis = { id, archivo };
      this.obtenerWorker().postMessage(solicitud);
    });
  }

  ngOnDestroy(): void {
    this.descartarWorker(new ErrorAnalisis('worker-caido', 'La página se cerró.'));
  }

  private obtenerWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/analisis.worker', import.meta.url));
      this.worker.onmessage = ({ data }: MessageEvent<RespuestaAnalisis>) => this.recibir(data);
      this.worker.onerror = () => this.descartarWorker(new ErrorAnalisis('worker-caido'));
    }
    return this.worker;
  }

  private recibir(respuesta: RespuestaAnalisis): void {
    const pendiente = this.pendientes.get(respuesta.id);
    if (!pendiente) return;

    clearTimeout(pendiente.temporizador);
    this.pendientes.delete(respuesta.id);

    if (respuesta.ok) {
      pendiente.resolver(respuesta.resultado);
    } else {
      pendiente.rechazar(new ErrorAnalisis('imagen-invalida', respuesta.error));
    }
  }

  /** Termina el hilo y rechaza lo que estaba en curso; el próximo análisis crea uno nuevo. */
  private descartarWorker(error: ErrorAnalisis): void {
    this.worker?.terminate();
    this.worker = null;

    for (const { rechazar, temporizador } of this.pendientes.values()) {
      clearTimeout(temporizador);
      rechazar(error);
    }
    this.pendientes.clear();
  }
}
