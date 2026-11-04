import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const URL_LOGIN = `${environment.apiUrl}/auth/login`;
  let componente: LoginComponent;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    componente = TestBed.createComponent(LoginComponent).componentInstance;
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('quita los espacios del correo antes de enviarlo', () => {
    componente.email.set('  ana@ejemplo.com ');
    componente.password.set('secreto123');
    componente.ingresar();
    expect(backend.expectOne(URL_LOGIN).request.body.email).toBe('ana@ejemplo.com');
  });

  it('no envía si faltan datos', () => {
    componente.email.set('   ');
    componente.password.set('secreto123');
    componente.ingresar();
    backend.expectNone(URL_LOGIN);
  });

  it('no envía dos veces mientras carga', () => {
    componente.email.set('ana@ejemplo.com');
    componente.password.set('secreto123');
    componente.ingresar();
    componente.ingresar();
    expect(componente.cargando()).toBeTrue();
    backend.expectOne(URL_LOGIN);
  });

  it('muestra el error traducido y libera el botón', () => {
    componente.email.set('ana@ejemplo.com');
    componente.password.set('mala');
    componente.ingresar();
    backend.expectOne(URL_LOGIN).flush(
      { error: 'x', codigo: 'CREDENCIALES_INVALIDAS' },
      { status: 401, statusText: 'Unauthorized' }
    );
    expect(componente.error()).toContain('Credenciales');
    expect(componente.cargando()).toBeFalse();
  });

  it('entra al dashboard si el login es correcto', () => {
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    componente.email.set('ana@ejemplo.com');
    componente.password.set('secreto123');
    componente.ingresar();
    backend.expectOne(URL_LOGIN).flush({ token: 't', usuario: { id: 1, nombre: 'Ana', email: 'a', puntos: 0 } });
    expect(navegar).toHaveBeenCalledWith(['/dashboard']);
  });
});
