import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    // Top level on purpose: everything under feature.routes is a child of
    // LayoutWrapperComponent and arrives with the tab bar, and this is a
    // focused flow the user drops into from outside the app.
    path: 'join/:token',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/groups/pages/join-group/join-group.component').then(
        (c) => c.JoinGroupComponent,
      ),
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
