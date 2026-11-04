import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);

  readonly email = signal('');
  readonly password = signal('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    const email = this.email().trim();
    if (this.isLoading() || !email || !this.password()) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.auth
      .logIn({ email, password: this.password() })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => this.error.set(this.language.httpError(err, 'loginError'))
      });
  }
}
