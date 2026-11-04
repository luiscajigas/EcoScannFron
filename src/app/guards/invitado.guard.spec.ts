import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { invitadoGuard } from './invitado.guard';

describe('invitadoGuard', () => {
  function ejecutar(estaAutenticado: boolean) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { estaAutenticado } }]
    });
    return TestBed.runInInjectionContext(() => invitadoGuard({} as never, {} as never));
  }

  it('deja pasar a quien no tiene sesión', () => {
    expect(ejecutar(false)).toBeTrue();
  });

  it('lleva al dashboard a quien ya tiene sesión', () => {
    expect((ejecutar(true) as UrlTree).toString()).toBe('/dashboard');
  });
});
