import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { authGuard } from '../guards/auth.guard';
import { RespuestaAuth } from '../models/models';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const API = environment.apiUrl;
const RESPUESTA: RespuestaAuth = {
  token: 'token-de-prueba',
  usuario: { id: 1, nombre: 'Ana', email: 'ana@ejemplo.com', puntos: 10 }
};

describe('autenticación en el cliente', () => {
  let auth: AuthService;
  let http: HttpClient;
  let backend: HttpTestingController;

  function configurar(): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  function iniciarSesion(): void {
    auth.login({ email: 'ana@ejemplo.com', password: 'secreto123' }).subscribe();
    backend.expectOne(`${API}/auth/login`).flush(RESPUESTA);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    backend?.verify();
    localStorage.clear();
  });

  it('el login guarda el token y actualiza el usuario', () => {
    configurar();
    iniciarSesion();

    expect(auth.token).toBe('token-de-prueba');
    expect(auth.estaAutenticado).toBeTrue();
    expect(auth.usuario()?.nombre).toBe('Ana');
  });

  it('actualizarPuntos cambia el usuario y lo persiste', () => {
    configurar();
    iniciarSesion();
    auth.actualizarPuntos(25);

    expect(auth.usuario()?.puntos).toBe(25);
    expect(JSON.parse(localStorage.getItem('ecoscan_usuario')!).puntos).toBe(25);
  });

  it('logout borra la sesión', () => {
    configurar();
    iniciarSesion();
    auth.logout();

    expect(auth.estaAutenticado).toBeFalse();
    expect(auth.usuario()).toBeNull();
  });

  it('un usuario guardado dañado no impide arrancar', () => {
    localStorage.setItem('ecoscan_usuario', '{dañado');
    configurar();
    expect(auth.usuario()).toBeNull();
  });

  it('el interceptor agrega el token solo a nuestra API', () => {
    configurar();
    iniciarSesion();

    http.get(`${API}/escaneos`).subscribe();
    const propia = backend.expectOne(`${API}/escaneos`);
    expect(propia.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    propia.flush([]);

    http.get('https://otro-sitio.example.com/datos').subscribe();
    const ajena = backend.expectOne('https://otro-sitio.example.com/datos');
    expect(ajena.request.headers.has('Authorization')).toBeFalse();
    ajena.flush({});
  });

  it('un 401 con sesión la cierra y lleva al login', () => {
    configurar();
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    iniciarSesion();

    http.get(`${API}/escaneos`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/escaneos`).flush({ error: 'x', codigo: 'TOKEN_INVALIDO' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.estaAutenticado).toBeFalse();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });

  it('otros errores no cierran la sesión', () => {
    configurar();
    iniciarSesion();

    http.get(`${API}/escaneos`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/escaneos`).flush({}, { status: 500, statusText: 'Error' });

    expect(auth.estaAutenticado).toBeTrue();
  });

  it('el guard deja pasar con sesión y redirige sin ella', () => {
    configurar();
    const ejecutar = () => TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    const sinSesion = ejecutar() as UrlTree;
    expect(sinSesion.toString()).toBe('/login');

    iniciarSesion();
    expect(ejecutar()).toBeTrue();
  });
});
