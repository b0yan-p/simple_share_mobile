import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, takeUntil, throwError } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { DeletedAccountCleanup } from 'src/app/auth/services/deleted-account-cleanup.service';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';

const SKIP_AUTH: (string | RegExp)[] = [
  // Signing in is how a token is obtained, so these cannot require one.
  '/auth/register',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/google',
  // Email confirmation happens before there is ever a session: the resend form
  // is reached from a refused login, and the confirmation link is followed out
  // of an inbox. Without these the interceptor logs the visitor out instead.
  '/auth/resend-verification',
  '/auth/confirm-email',
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

  const cleanup = inject(DeletedAccountCleanup);
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
    takeUntil(cleanup.ended),
    catchError((err) => {
      if (err?.status === 401) {
        // fire-and-forget logout
        if (err.headers?.get('X-Account-Deleted') === 'true') {
          void cleanup.finish(false).catch(() => window.location.reload());
        } else {
          authService.logout();
        }
      }
      return throwError(() => err);
    }),
  );
};
