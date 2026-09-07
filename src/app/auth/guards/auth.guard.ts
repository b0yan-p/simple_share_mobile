import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Protects the app shell. The token is already loaded into TokenStorageService
 * by AuthBootstrapService (an app initializer), so reading the signal here is
 * safe - initializers always finish before the router runs.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const tokenService = inject(TokenStorageService);
  const router = inject(Router);

  if (tokenService.isAuthenticated()) return true;

  // Carry the attempted URL through login: someone opening an invite link
  // usually has no account yet, and dropping it would strand them on home.
  return router.createUrlTree(['login'], { queryParams: { returnUrl: state.url } });
};

/** Keeps an already logged in user away from the login/register pages. */
export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenStorageService);
  const router = inject(Router);

  if (!tokenService.isAuthenticated()) return true;

  return router.createUrlTree(['home']);
};
