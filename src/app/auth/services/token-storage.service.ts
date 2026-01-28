import { Injectable, signal } from '@angular/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { catchError, first, from, map, Observable, of, tap } from 'rxjs';
import { LoginUser } from '../models/login-user.model';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly ACCESS = 'access_token';
  private readonly USER = 'user';

  user = signal<LoginUser | null>(null);
  token = signal<string | null>(null);

  setAccessToken(token: string): Observable<boolean> {
    return from(SecureStoragePlugin.set({ key: this.ACCESS, value: token })).pipe(
      first(),
      map((e) => e.value),
      tap(() => this.token.set(token)),
    );
  }

  getAccessToken(): Observable<string | null> {
    return from(SecureStoragePlugin.get({ key: this.ACCESS })).pipe(
      first(),
      map((e) => e.value),
      tap((e) => this.token.set(e)),
      catchError((e) => of(null)),
    );
  }

  setUser(user: LoginUser) {
    return from(SecureStoragePlugin.set({ key: this.USER, value: JSON.stringify(user) })).pipe(
      first(),
      map(() => user),
      tap((e) => this.user.set(e)),
    );
  }

  getUser(): Observable<LoginUser | null> {
    return from(SecureStoragePlugin.get({ key: this.USER })).pipe(
      first(),
      map((e) => JSON.parse(e.value || 'null')),
      tap((e) => this.user.set(e)),
      catchError((e) => of(null)),
    );
  }

  clearAll(): Observable<boolean> {
    return from(SecureStoragePlugin.clear()).pipe(
      first(),
      map((e) => e.value),
      tap((e) => {
        this.token.set(null);
        this.user.set(null);
      }),
    );
  }

  isTokenExpired(token: string, skewSeconds = 30): boolean {
    const payload = this.decodeJwtPayload(token);

    const exp = payload?.exp;
    if (typeof exp !== 'number') return true;

    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= exp - skewSeconds;
  }

  decodeJwtPayload(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      // base64url -> base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );

      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
