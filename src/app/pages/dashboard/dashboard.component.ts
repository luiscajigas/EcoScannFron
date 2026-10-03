import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EscaneoService } from '../../services/escaneo.service';
import { Escaneo, ResultadoEscaneo } from '../../models/models';

@Component({
    selector: 'app-dashboard',
    imports: [],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('inputArchivo') inputArchivo!: ElementRef<HTMLInputElement>;

  historial: Escaneo[] = [];
  cargandoHistorial = true;

  procesando = false;
  previsualizacion: string | null = null;
  resultado: ResultadoEscaneo | null = null;
  error: string | null = null;

  private worker: Worker | null = null;

  constructor(
    private auth: AuthService,
    private escaneoService: EscaneoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../../workers/analisis.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => this.manejarResultadoWorker(data);
    } else {
      this.error = 'Tu navegador no soporta Web Workers.';
    }

    this.cargarHistorial();
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }

  cargarHistorial(): void {
    this.cargandoHistorial = true;
    this.escaneoService.historial().subscribe({
      next: (lista) => {
        this.historial = lista;
        this.cargandoHistorial = false;
      },
      error: () => (this.cargandoHistorial = false)
    });
  }

  abrirSelectorArchivo(): void {
    this.inputArchivo.nativeElement.click();
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo || !this.worker) return;

    this.error = null;
    this.resultado = null;
    this.procesando = true;
    this.previsualizacion = URL.createObjectURL(archivo);

    this.worker.postMessage({ archivo });
  }

  private manejarResultadoWorker(data: any): void {
    if (!data.ok) {
      this.procesando = false;
      this.error = 'No se pudo procesar la imagen: ' + data.error;
      return;
    }

    const { categoriaClave, confianza, anchoPx, altoPx } = data.resultado;

    this.escaneoService.registrarEscaneo(categoriaClave, confianza, anchoPx, altoPx).subscribe({
      next: (respuesta) => {
        this.resultado = respuesta;
        this.procesando = false;
        this.auth.actualizarPuntosLocal(respuesta.puntosTotales);
        this.cargarHistorial();
      },
      error: (err) => {
        this.procesando = false;
        this.error = err.error?.error || 'No se pudo registrar el escaneo.';
      }
    });
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  get usuario() {
    return this.auth.usuarioActual;
  }
}
