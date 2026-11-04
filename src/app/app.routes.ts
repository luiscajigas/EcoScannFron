import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// Cada página se descarga cuando se visita: quien entra al login no baja el dashboard.
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then((m) => m.RegistroComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  { path: '**', redirectTo: 'login' }
];
