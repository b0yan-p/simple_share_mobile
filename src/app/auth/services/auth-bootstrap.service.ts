import { inject, Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { catchError, forkJoin, map, Observable, of, switchMap, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthBootstrapService {
  tokenService = inject(TokenStorageService);

  private _ready = false;
  get ready() {
    return this._ready;
  }

  init(): Observable<void> {
    return forkJoin({
      token: this.tokenService.getAccessToken(),
      user: this.tokenService.getUser(),
    }).pipe(
      switchMap(({ token, user }) => {
        // no token => user is not logged in
        if (!token) return of(void 0);

        // token exists but is expired=> logout/clear
        if (this.tokenService.isTokenExpired(token)) {
          return this.tokenService.clearAll().pipe(
            map(() => void 0),
            catchError(() => of(void 0)),
          );
        }
        return of(void 0);
      }),
      map(() => void 0),
      catchError(() => of(void 0)),
      take(1),
    );
  }
}
