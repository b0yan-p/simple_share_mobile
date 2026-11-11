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
    // Unguarded for the same reason as verify-email: the user is mid-signup and
    // has no session yet, and guestGuard would bounce the one case where they do.
    path: 'check-email',
    loadComponent: () =>
      import('./auth/pages/check-email/check-email.component').then(
        (c) => c.CheckEmailComponent,
      ),
  },
  {
    // Top level and unguarded: it is reached from an email, by someone who is
    // by definition not signed in yet - guestGuard would bounce the one case
    // where they already are.
    path: 'verify-email',
    loadComponent: () =>
      import('./auth/pages/verify-email/verify-email.component').then(
        (c) => c.VerifyEmailComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadChildren: () => import('./features/feature.routes').then((m) => m.routes),
  },
  {
    path: 'welcome',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/pages/welcome/welcome.component').then((c) => c.WelcomeComponent),
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
