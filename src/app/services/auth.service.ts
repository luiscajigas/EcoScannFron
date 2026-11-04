import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespuestaAuth, SolicitudLogin, SolicitudRegistro, Usuario } from '../models/models';
import { almacenamiento } from './almacenamiento';

const CLAVE_TOKEN = 'ecoscan_token';
const CLAVE_USUARIO = 'ecoscan_usuario';

/** Un dato guardado dañado no debe impedir que la app arranque. */
function leerUsuarioGuardado(): Usuario | null {
  try {
    return JSON.parse(almacenamiento.leer(CLAVE_USUARIO) ?? 'null');
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly usuarioActual = signal<Usuario | null>(leerUsuarioGuardado());
  private tokenActual = almacenamiento.leer(CLAVE_TOKEN);

  readonly usuario = this.usuarioActual.asReadonly();

  registro(solicitud: SolicitudRegistro): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/registro`, solicitud)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  login(solicitud: SolicitudLogin): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/login`, solicitud)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  logout(): void {
    almacenamiento.borrar(CLAVE_TOKEN);
    almacenamiento.borrar(CLAVE_USUARIO);
    this.tokenActual = null;
    this.usuarioActual.set(null);
  }

  get token(): string | null {
    return this.tokenActual;
  }

  get estaAutenticado(): boolean {
    return !!this.token;
  }

  actualizarPuntos(puntos: number): void {
    const usuario = this.usuarioActual();
    if (usuario) this.guardarUsuario({ ...usuario, puntos });
  }

  private guardarSesion({ token, usuario }: RespuestaAuth): void {
    almacenamiento.guardar(CLAVE_TOKEN, token);
    this.tokenActual = token;
    this.guardarUsuario(usuario);
  }

  private guardarUsuario(usuario: Usuario): void {
    almacenamiento.guardar(CLAVE_USUARIO, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }
}
