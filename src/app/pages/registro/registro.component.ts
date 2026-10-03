import { Component, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-registro',
    imports: [FormsModule, RouterLink],
    templateUrl: './registro.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './registro.component.css'
})
export class RegistroComponent {
  nombre = '';
  email = '';
  password = '';
  cargando = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  registrar(): void {
    this.cargando = true;
    this.error = null;
    this.auth.registro(this.nombre, this.email, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.error || 'No se pudo completar el registro.';
      }
    });
  }
}
