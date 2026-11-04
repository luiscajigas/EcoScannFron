import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { AuthService } from './auth.service';

// Render puede tardar cerca de un minuto en despertar y Gemini hasta 45 segundos.
const LIMITE_ESPERA_MS = 120000;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(peticion).pipe(
    timeout(LIMITE_ESPERA_MS),
    catchError((err) => {
      if (token && err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
