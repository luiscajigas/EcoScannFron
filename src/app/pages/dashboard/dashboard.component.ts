import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Escaneo, ResultadoEscaneo } from '../../models/models';
import { AnalisisImagenService, ErrorAnalisis } from '../../services/analisis-imagen.service';
import { AuthService } from '../../services/auth.service';
import { EscaneoService } from '../../services/escaneo.service';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';
import { ResultadoAnalisis } from '../../workers/analisis.mensajes';
import { HistorialEscaneosComponent } from './historial-escaneos.component';
import { ResultadoEscaneoComponent } from './resultado-escaneo.component';

@Component({
  selector: 'app-dashboard',
  imports: [HistorialEscaneosComponent, ResultadoEscaneoComponent],
  // Se provee aquí para que el Worker viva lo mismo que esta página.
  providers: [AnalisisImagenService],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly escaneos = inject(EscaneoService);
  private readonly analisis = inject(AnalisisImagenService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly tema = inject(ThemeService);
  readonly idioma = inject(LanguageService);

  readonly usuario = this.auth.usuario;
  readonly historial = signal<Escaneo[]>([]);
  readonly cargandoHistorial = signal(true);
  readonly procesando = signal(false);
  readonly previsualizacion = signal<string | null>(null);
  readonly resultado = signal<ResultadoEscaneo | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.liberarPrevisualizacion());
    this.cargarHistorial();
  }

  async onArchivoSeleccionado(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // sin esto, volver a elegir la misma foto no dispara el evento
    if (!archivo) return;

    const problema = this.validarArchivo(archivo);
    if (problema) {
      this.error.set(problema);
      return;
    }

    this.error.set(null);
    this.resultado.set(null);
    this.procesando.set(true);
    this.liberarPrevisualizacion();
    this.previsualizacion.set(URL.createObjectURL(archivo));

    try {
      this.registrar(await this.analisis.analizar(archivo));
    } catch (err) {
      this.procesando.set(false);
      this.error.set(this.mensajeErrorAnalisis(err));
    }
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private cargarHistorial(): void {
    this.cargandoHistorial.set(true);
    this.escaneos
      .historial()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.historial.set(lista);
          this.cargandoHistorial.set(false);
        },
        error: (err) => {
          this.cargandoHistorial.set(false);
          this.error.set(this.idioma.errorHttp(err, 'scanLoadError'));
        }
      });
  }

  private registrar({ categoriaClave, confianza, anchoPx, altoPx, imagenComprimidaBase64 }: ResultadoAnalisis): void {
    this.escaneos
      .registrarEscaneo({ categoriaClave, confianza, anchoPx, altoPx, imagenBase64: imagenComprimidaBase64 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.resultado.set(respuesta);
          this.procesando.set(false);
          this.auth.actualizarPuntos(respuesta.puntosTotales);
          this.cargarHistorial();
        },
        error: (err) => {
          this.procesando.set(false);
          this.error.set(this.idioma.errorHttp(err, 'saveScanError'));
        }
      });
  }

  /** Algunos sistemas no informan el tipo de ciertas fotos: en ese caso decide el Worker. */
  private validarArchivo(archivo: File): string | null {
    if (archivo.type && !archivo.type.startsWith('image/')) return this.idioma.t('imageNotSupported');
    return null;
  }

  private mensajeErrorAnalisis(err: unknown): string {
    if (!(err instanceof ErrorAnalisis)) return this.idioma.t('imageError');

    switch (err.motivo) {
      case 'sin-soporte':
        return this.idioma.t('workerError');
      case 'tiempo-agotado':
        return this.idioma.t('imageTimeout');
      case 'worker-caido':
        return this.idioma.t('imageError');
      case 'imagen-invalida':
        return `${this.idioma.t('imageError')} ${err.message}`;
    }
  }

  /** Las URL de objeto retienen la imagen en memoria hasta que se revocan. */
  private liberarPrevisualizacion(): void {
    const url = this.previsualizacion();
    if (url) URL.revokeObjectURL(url);
  }
}
