import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  const REGISTER_URL = `${environment.apiUrl}/auth/register`;
  let component: RegisterComponent;
  let backend: HttpTestingController;

  function fill(name: string, email: string, password: string): void {
    component.name.set(name);
    component.email.set(email);
    component.password.set(password);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(RegisterComponent).componentInstance;
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('requires a password of at least 8 characters', () => {
    fill('Ana', 'ana@example.com', '1234567');
    expect(component.isFormComplete()).toBeFalse();
    component.password.set('12345678');
    expect(component.isFormComplete()).toBeTrue();
  });

  it('a name with only spaces does not count', () => {
    fill('   ', 'ana@example.com', 'secret123');
    expect(component.isFormComplete()).toBeFalse();
    component.submit();
    backend.expectNone(REGISTER_URL);
  });

  it('trims the name and the email', () => {
    fill(' Ana ', ' ana@example.com ', 'secret123');
    component.submit();
    const { name, email, password } = backend.expectOne(REGISTER_URL).request.body;
    expect([name, email, password]).toEqual(['Ana', 'ana@example.com', 'secret123']);
  });

  it('shows when the email is already in use', () => {
    fill('Ana', 'ana@example.com', 'secret123');
    component.submit();
    backend.expectOne(REGISTER_URL).flush(
      { error: 'x', code: 'EMAIL_IN_USE' },
      { status: 409, statusText: 'Conflict' }
    );
    expect(component.error()).toContain('Ya existe');
    expect(component.isLoading()).toBeFalse();
  });
});
