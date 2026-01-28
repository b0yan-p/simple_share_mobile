import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';

const SKIP_AUTH = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (SKIP_AUTH.some((x) => req.url.includes(x))) return next(req);

  const tokenService = inject(TokenStorageService);
  const authService = inject(AuthService);

  const token = tokenService.token() ?? tokenService.user()?.token;

  if (!token) authService.logout();

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
