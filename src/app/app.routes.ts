import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

// Each page is downloaded when visited: whoever opens the login does not download the dashboard.
// The titles are shown to users, so they stay in Spanish.
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    title: 'Iniciar sesión | EcoScan',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    title: 'Crear cuenta | EcoScan',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    title: 'Mi espacio | EcoScan',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'puntos-ecologicos',
    title: 'Puntos ecológicos | EcoScan',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/eco-points.component').then((m) => m.EcoPointsComponent)
  },
  { path: '**', redirectTo: 'login' }
];
