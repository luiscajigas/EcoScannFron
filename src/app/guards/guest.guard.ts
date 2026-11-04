import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Users who are already signed in do not need to see the login or registration pages. */
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isAuthenticated || inject(Router).createUrlTree(['/dashboard']);
