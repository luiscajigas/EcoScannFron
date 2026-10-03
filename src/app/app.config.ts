import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';
import { environment } from '../environments/environment';

function cargarConfiguracionProduccion(): Promise<void> {
  if (!environment.production) return Promise.resolve();
  const http = inject(HttpClient);

  return firstValueFrom(
    http.get<{ apiUrl: string }>('/api/config').pipe(
      tap(({ apiUrl }) => {
        environment.apiUrl = apiUrl.replace(/\/+$/, '');
      })
    )
  ).then(() => undefined);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideAppInitializer(cargarConfiguracionProduccion)
  ]
};
