import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Router } from '@angular/router';
import { catchError, first, Observable, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GoogleLoginInput } from '../models/google-login-input.model';
import { LoginUser } from '../models/login-user.model';
import { GoogleAuthService } from './google-auth.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private googleAuth = inject(GoogleAuthService);
  private router = inject(Router);

  private googleLoginAPI = `${environment.baseAPIUrl}/auth/google`;

  /**
   * One endpoint covers both cases: the backend logs the user in or registers
   * them and returns the same LoginUser either way, so nothing here branches.
   */
  public googleLogin(): Observable<boolean> {
    return this.googleAuth.signIn().pipe(
      switchMap((idToken) =>
        this.http.post<LoginUser>(this.googleLoginAPI, { idToken } as GoogleLoginInput),
      ),
      first(),
      switchMap((res) => this.tokenStorage.setUser(res)),
      switchMap((res) => this.tokenStorage.setAccessToken(res.token)),
      catchError((err) => {
        console.error(err);
        throw err;
      }),
    );
  }

  public logout() {
    // Started first so it overlaps the local clear, but deliberately not waited
    // on: Play Services spends ~3s clearing the restore credential, while
    // dropping the local session - the part the user actually experiences as
    // logging out - takes single digit milliseconds. Errors are swallowed for
    // the same reason, a failing Google sign out must never strand the user in
    // the app. Worst case, the app dies inside that window and the next sign in
    // skips account selection.
    this.googleAuth
      .signOut()
      .pipe(
        first(),
        catchError(() => of(void 0)),
      )
      .subscribe();

    this.tokenStorage
      .clearAll()
      .pipe(first())
      .subscribe(() => this.router.navigate(['login']));
  }
}
