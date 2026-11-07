import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function run(isAuthenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated } }]
    });
    return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  }

  it('lets users with a session through', () => {
    expect(run(true)).toBeTrue();
  });

  it('sends users without a session to the login', () => {
    expect((run(false) as UrlTree).toString()).toBe('/login');
  });
});
