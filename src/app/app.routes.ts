import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadChildren: () => import('./features/feature.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/pages/login/login.component').then((c) => c.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/pages/register/register.component').then((c) => c.RegisterComponent),
  },
];
