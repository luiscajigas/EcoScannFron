import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/models';
import { safeStorage } from './storage';

const TOKEN_KEY = 'ecoscan_token';
const USER_KEY = 'ecoscan_user';

/** Corrupted stored data must not stop the app from starting. */
function readStoredUser(): User | null {
  try {
    return JSON.parse(safeStorage.read(USER_KEY) ?? 'null');
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUser = signal<User | null>(readStoredUser());
  private currentToken = safeStorage.read(TOKEN_KEY);

  readonly user = this.currentUser.asReadonly();

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  logIn(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  logOut(): void {
    safeStorage.remove(TOKEN_KEY);
    safeStorage.remove(USER_KEY);
    this.currentToken = null;
    this.currentUser.set(null);
  }

  get token(): string | null {
    return this.currentToken;
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  updatePoints(points: number): void {
    const user = this.currentUser();
    if (user) this.saveUser({ ...user, points });
  }

  private saveSession({ token, user }: AuthResponse): void {
    safeStorage.write(TOKEN_KEY, token);
    this.currentToken = token;
    this.saveUser(user);
  }

  private saveUser(user: User): void {
    safeStorage.write(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }
}
