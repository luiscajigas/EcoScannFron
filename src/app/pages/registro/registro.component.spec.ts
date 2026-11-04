import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { RegistroComponent } from './registro.component';

describe('RegistroComponent', () => {
  const URL_REGISTRO = `${environment.apiUrl}/auth/registro`;
  let componente: RegistroComponent;
  let backend: HttpTestingController;

  function llenar(nombre: string, email: string, password: string): void {
    componente.nombre.set(nombre);
    componente.email.set(email);
    componente.password.set(password);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    componente = TestBed.createComponent(RegistroComponent).componentInstance;
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('exige una contraseña de al menos 8 caracteres', () => {
    llenar('Ana', 'ana@ejemplo.com', '1234567');
    expect(componente.formularioCompleto()).toBeFalse();
    componente.password.set('12345678');
    expect(componente.formularioCompleto()).toBeTrue();
  });

  it('un nombre con solo espacios no cuenta', () => {
    llenar('   ', 'ana@ejemplo.com', 'secreto123');
    expect(componente.formularioCompleto()).toBeFalse();
    componente.registrar();
    backend.expectNone(URL_REGISTRO);
  });

  it('quita los espacios del nombre y del correo', () => {
    llenar(' Ana ', ' ana@ejemplo.com ', 'secreto123');
    componente.registrar();
    const { nombre, email, password } = backend.expectOne(URL_REGISTRO).request.body;
    expect([nombre, email, password]).toEqual(['Ana', 'ana@ejemplo.com', 'secreto123']);
  });

  it('muestra si el correo ya está en uso', () => {
    llenar('Ana', 'ana@ejemplo.com', 'secreto123');
    componente.registrar();
    backend.expectOne(URL_REGISTRO).flush(
      { error: 'x', codigo: 'CORREO_EN_USO' },
      { status: 409, statusText: 'Conflict' }
    );
    expect(componente.error()).toContain('Ya existe');
    expect(componente.cargando()).toBeFalse();
  });
});
