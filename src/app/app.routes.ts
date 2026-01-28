import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '',
    loadChildren: () => import('./features/feature.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/pages/login/login.component').then((c) => c.LoginComponent),
  },
];
