import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { timeout } from 'rxjs';
import { AuthService } from './auth.service';

// Render puede tardar cerca de un minuto en despertar y Gemini hasta 45 segundos.
const LIMITE_ESPERA_MS = 120000;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(peticion).pipe(timeout(LIMITE_ESPERA_MS));
};
