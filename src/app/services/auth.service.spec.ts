import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../models/models';
import { AuthService } from './auth.service';

const API = environment.apiUrl;
const RESPONSE: AuthResponse = {
  token: 'test-token',
  user: { id: 1, name: 'Ana', email: 'ana@example.com', points: 10 }
};

describe('AuthService', () => {
  let auth: AuthService;
  let backend: HttpTestingController;

  function setUp(): void {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
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

  it('registering also starts the session', () => {
    setUp();
    auth.register({ name: 'Ana', email: 'ana@example.com', password: 'secret123' }).subscribe();
    backend.expectOne(`${API}/auth/register`).flush(RESPONSE);

    expect(auth.isAuthenticated).toBeTrue();
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
    expect(localStorage.getItem('ecoscan_token')).toBeNull();
  });

  it('recovers the session saved in a previous visit', () => {
    localStorage.setItem('ecoscan_token', 'saved-token');
    localStorage.setItem('ecoscan_user', JSON.stringify(RESPONSE.user));
    setUp();

    expect(auth.token).toBe('saved-token');
    expect(auth.user()?.name).toBe('Ana');
  });

  it('a corrupted stored user does not stop the app from starting', () => {
    localStorage.setItem('ecoscan_user', '{corrupted');
    setUp();
    expect(auth.user()).toBeNull();
  });
});
