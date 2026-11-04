import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';

// Debe coincidir con minLength de SolicitudRegistro.password en el contrato.
const LARGO_MINIMO_PASSWORD = 8;

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly tema = inject(ThemeService);
  readonly idioma = inject(LanguageService);

  readonly nombre = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formularioCompleto = computed(
    () => !!this.nombre().trim() && !!this.email().trim() && this.password().length >= LARGO_MINIMO_PASSWORD
  );

  registrar(): void {
    if (this.cargando() || !this.formularioCompleto()) return;

    this.cargando.set(true);
    this.error.set(null);

    this.auth
      .registro({ nombre: this.nombre().trim(), email: this.email().trim(), password: this.password() })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => this.error.set(this.idioma.errorHttp(err, 'registerError'))
      });
  }
}
