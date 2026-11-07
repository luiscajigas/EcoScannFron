import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const API = environment.apiUrl;

describe('authInterceptor', () => {
  let auth: AuthService;
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('ecoscan_token', 'test-token');
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
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('adds the token only to our API', () => {
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
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    http.get(`${API}/scans`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/scans`).flush({ error: 'x', code: 'INVALID_TOKEN' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('other errors do not close the session', () => {
    http.get(`${API}/scans`).subscribe({ error: () => undefined });
    backend.expectOne(`${API}/scans`).flush({}, { status: 500, statusText: 'Error' });

    expect(auth.isAuthenticated).toBeTrue();
  });
});
