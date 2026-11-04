import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const LOGIN_URL = `${environment.apiUrl}/auth/login`;
  let component: LoginComponent;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(LoginComponent).componentInstance;
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('trims the email before sending it', () => {
    component.email.set('  ana@example.com ');
    component.password.set('secret123');
    component.submit();
    expect(backend.expectOne(LOGIN_URL).request.body.email).toBe('ana@example.com');
  });

  it('does not send if data is missing', () => {
    component.email.set('   ');
    component.password.set('secret123');
    component.submit();
    backend.expectNone(LOGIN_URL);
  });

  it('does not send twice while loading', () => {
    component.email.set('ana@example.com');
    component.password.set('secret123');
    component.submit();
    component.submit();
    expect(component.isLoading()).toBeTrue();
    backend.expectOne(LOGIN_URL);
  });

  it('shows the translated error and releases the button', () => {
    component.email.set('ana@example.com');
    component.password.set('wrong');
    component.submit();
    backend.expectOne(LOGIN_URL).flush(
      { error: 'x', code: 'INVALID_CREDENTIALS' },
      { status: 401, statusText: 'Unauthorized' }
    );
    expect(component.error()).toContain('Credenciales');
    expect(component.isLoading()).toBeFalse();
  });

  it('goes to the dashboard if the login succeeds', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    component.email.set('ana@example.com');
    component.password.set('secret123');
    component.submit();
    backend.expectOne(LOGIN_URL).flush({ token: 't', user: { id: 1, name: 'Ana', email: 'a', points: 0 } });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
