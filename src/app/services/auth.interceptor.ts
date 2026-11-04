import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Render can take about a minute to wake up, and the AI almost as long.
const REQUEST_LIMIT_MS = 120000;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // The token only travels to our API, never to other domains.
  const token = req.url.startsWith(environment.apiUrl) ? auth.token : null;
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    timeout(REQUEST_LIMIT_MS),
    catchError((err) => {
      if (token && err instanceof HttpErrorResponse && err.status === 401) {
        auth.logOut();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
