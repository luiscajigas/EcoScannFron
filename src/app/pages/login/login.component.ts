import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { AuthBrandComponent } from '../../shared/auth-brand/auth-brand.component';

@Component({
  selector: 'app-login',
  imports: [AuthBrandComponent, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../auth-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly language = inject(LanguageService);

  readonly email = signal('');
  readonly password = signal('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly demoAccount = environment.demoAccount;

  /** Fills the form with the demo account and signs in, so it can be tried in one click. */
  useDemoAccount(): void {
    this.email.set(this.demoAccount.email);
    this.password.set(this.demoAccount.password);
    this.submit();
  }

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
