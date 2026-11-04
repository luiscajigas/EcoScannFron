import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { authGuard } from '../guards/auth.guard';
import { AuthResponse } from '../models/models';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const API = environment.apiUrl;
const RESPONSE: AuthResponse = {
  token: 'test-token',
  user: { id: 1, name: 'Ana', email: 'ana@example.com', points: 10 }
};

describe('client authentication', () => {
  let auth: AuthService;
  let http: HttpClient;
  let backend: HttpTestingController;

  function setUp(): void {
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

  function logIn(): void {
    auth.logIn({ email: 'ana@example.com', password: 'secret123' }).subscribe();
    backend.expectOne(`${API}/auth/login`).flush(RESPONSE);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    backend?.verify();
    localStorage.clear();
  });

  it('login saves the token and updates the user', () => {
    setUp();
    logIn();

    expect(auth.token).toBe('test-token');
    expect(auth.isAuthenticated).toBeTrue();
    expect(auth.user()?.name).toBe('Ana');
  });

  it('updatePoints changes the user and persists it', () => {
    setUp();
    logIn();
    auth.updatePoints(25);

    expect(auth.user()?.points).toBe(25);
    expect(JSON.parse(localStorage.getItem('ecoscan_user')!).points).toBe(25);
  });

  it('logOut clears the session', () => {
    setUp();
    logIn();
    auth.logOut();

    expect(auth.isAuthenticated).toBeFalse();
    expect(auth.user()).toBeNull();
  });

  it('a corrupted stored user does not stop the app from starting', () => {
    localStorage.setItem('ecoscan_user', '{corrupted');
    setUp();
    expect(auth.user()).toBeNull();
  });

  it('the interceptor adds the token only to our API', () => {
    setUp();
    logIn();

    http.get(`${API}/scans`).subscribe();
    const own = backend.expectOne(`${API}/scans`);
    expect(own.request.headers.get('Authorization')).toBe('Bearer test-token');
    own.flush([]);

    http.get('https://other-site.example.com/data').subscribe();
    const external = backend.expectOne('https://other-site.example.com/data');
    expect(external.request.headers.has('Authorization')).toBeFalse();
    external.flush({});
  });

  it('a 401 with a session closes it and goes to the login', () => {
    setUp();
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    logIn();

    http.get(`${API}/scans`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/scans`).flush({ error: 'x', code: 'INVALID_TOKEN' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('other errors do not close the session', () => {
    setUp();
    logIn();

    http.get(`${API}/scans`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/scans`).flush({}, { status: 500, statusText: 'Error' });

    expect(auth.isAuthenticated).toBeTrue();
  });

  it('the guard lets users with a session through and redirects those without one', () => {
    setUp();
    const run = () => TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    const withoutSession = run() as UrlTree;
    expect(withoutSession.toString()).toBe('/login');

    logIn();
    expect(run()).toBeTrue();
  });
});
