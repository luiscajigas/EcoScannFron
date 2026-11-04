import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  function run(isAuthenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated } }]
    });
    return TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
  }

  it('lets users without a session through', () => {
    expect(run(false)).toBeTrue();
  });

  it('sends users with a session to the dashboard', () => {
    expect((run(true) as UrlTree).toString()).toBe('/dashboard');
  });
});
