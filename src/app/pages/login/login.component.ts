import { Component, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';

@Component({
    selector: 'app-login',
    imports: [FormsModule, RouterLink],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  cargando = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    readonly tema: ThemeService,
    readonly idioma: LanguageService
  ) {}

  ingresar(): void {
    this.cargando = true;
    this.error = null;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        this.error = this.idioma.apiError(err.error?.error, 'loginError');
      }
    });
  }
}
