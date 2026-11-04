import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Quien ya inició sesión no necesita ver el login ni el registro. */
export const invitadoGuard: CanActivateFn = () =>
  !inject(AuthService).estaAutenticado || inject(Router).createUrlTree(['/dashboard']);
