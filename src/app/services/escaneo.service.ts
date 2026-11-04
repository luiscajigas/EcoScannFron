import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Escaneo, ResultadoEscaneo, SolicitudEscaneo } from '../models/models';

@Injectable({ providedIn: 'root' })
export class EscaneoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  historial(): Observable<Escaneo[]> {
    return this.http.get<Escaneo[]>(`${this.apiUrl}/escaneos`);
  }

  registrarEscaneo(solicitud: SolicitudEscaneo): Observable<ResultadoEscaneo> {
    return this.http.post<ResultadoEscaneo>(`${this.apiUrl}/escaneos`, solicitud);
  }
}
