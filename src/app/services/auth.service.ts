import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  puntos: number;
}

interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

const CLAVE_TOKEN = 'ecoscan_token';
const CLAVE_USUARIO = 'ecoscan_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registro(nombre: string, email: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/registro`, { nombre, email, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  login(email: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }

  private guardarSesion(r: RespuestaAuth): void {
    localStorage.setItem(CLAVE_TOKEN, r.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(r.usuario));
  }

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  get estaAutenticado(): boolean {
    return !!this.token;
  }

  get usuarioActual(): Usuario | null {
    const raw = localStorage.getItem(CLAVE_USUARIO);
    return raw ? JSON.parse(raw) : null;
  }

  actualizarPuntosLocal(puntos: number): void {
    const usuario = this.usuarioActual;
    if (usuario) {
      usuario.puntos = puntos;
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    }
  }
}
