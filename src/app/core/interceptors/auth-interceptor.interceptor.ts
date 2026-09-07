import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';

const SKIP_AUTH: (string | RegExp)[] = [
  '/auth/login',
  '/auth/register',
  // Public invite preview: /groupinvitation/{token} and nothing else on that
  // controller. A regex rather than a substring because plain matching cannot
  // tell it apart from /groupinvitation/group/{id} or /groupinvitation/{token}/join,
  // both of which are authenticated. Without this entry the interceptor would
  // log a visitor out for opening an invite link.
  /\/groupinvitation\/(?!group\/)[^/]+$/i,
];

const skipsAuth = (url: string): boolean =>
  SKIP_AUTH.some((rule) => (typeof rule === 'string' ? url.includes(rule) : rule.test(url)));

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (skipsAuth(req.url)) return next(req);

  const tokenService = inject(TokenStorageService);
  const authService = inject(AuthService);

  const token = tokenService.token() ?? tokenService.user()?.token;

  if (!token) {
    authService.logout();
    return throwError(() => new Error('No token'));
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq).pipe(
    catchError((err) => {
      if (err?.status === 401) {
        // fire-and-forget logout
        authService.logout();
      }
      return throwError(() => err);
    }),
  );
};
