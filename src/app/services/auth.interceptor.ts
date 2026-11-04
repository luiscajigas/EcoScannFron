import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Render puede tardar cerca de un minuto en despertar y la IA casi lo mismo.
const LIMITE_ESPERA_MS = 120000;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // El token solo viaja a nuestra API, nunca a otros dominios.
  const token = req.url.startsWith(environment.apiUrl) ? auth.token : null;
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
