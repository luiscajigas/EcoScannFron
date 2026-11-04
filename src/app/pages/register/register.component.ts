import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';

// Must match minLength of RegisterRequest.password in the contract.
const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);

  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isFormComplete = computed(
    () => !!this.name().trim() && !!this.email().trim() && this.password().length >= MIN_PASSWORD_LENGTH
  );

  submit(): void {
    if (this.isLoading() || !this.isFormComplete()) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.auth
      .register({ name: this.name().trim(), email: this.email().trim(), password: this.password() })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => this.error.set(this.language.httpError(err, 'registerError'))
      });
  }
}
