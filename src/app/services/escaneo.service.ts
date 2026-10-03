import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria, Escaneo, ResultadoEscaneo } from '../models/models';

@Injectable({ providedIn: 'root' })
export class EscaneoService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`);
  }

  historial(): Observable<Escaneo[]> {
    return this.http.get<Escaneo[]>(`${this.apiUrl}/escaneos`);
  }

  registrarEscaneo(categoriaClave: string, confianza: number, anchoPx: number, altoPx: number): Observable<ResultadoEscaneo> {
    return this.http.post<ResultadoEscaneo>(`${this.apiUrl}/escaneos`, {
      categoriaClave,
      confianza,
      anchoPx,
      altoPx
    });
  }
}
