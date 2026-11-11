import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Router } from '@angular/router';
import { catchError, first, Observable, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConfirmEmailInput } from '../models/confirm-email-input.model';
import { ConfirmEmailResult } from '../models/confirm-email-result.model';
import { GoogleLoginInput } from '../models/google-login-input.model';
import { LoginInput } from '../models/login-input.model';
import { LoginUser } from '../models/login-user.model';
import { RegisterInput } from '../models/register-input.model';
import { RegisterResult } from '../models/register-result.model';
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

  private registerAPI = `${environment.baseAPIUrl}/auth/register`;
  private confirmEmailAPI = `${environment.baseAPIUrl}/auth/confirm-email`;
  private resendVerificationAPI = `${environment.baseAPIUrl}/auth/resend-verification`;
  private loginAPI = `${environment.baseAPIUrl}/auth/login`;
  private googleLoginAPI = `${environment.baseAPIUrl}/auth/google`;

  /**
   * Registering does not sign the user in: the API creates the account
   * unconfirmed, mails a link and answers without a token, so there is nothing
   * to store. Sending the same address again while it is still unconfirmed
   * resends the link and leaves the password and profile alone.
   */
  public register(input: RegisterInput): Observable<RegisterResult> {
    return this.http.post<RegisterResult>(this.registerAPI, input).pipe(first());
  }

  /**
   * Asks for the confirmation link again. Answers the same way whether or not
   * the address is one that needs confirming, so nothing here can be used to
   * find out who is registered.
   */
  public resendVerification(email: string): Observable<unknown> {
    return this.http.post(this.resendVerificationAPI, { email }).pipe(first());
  }

  /**
   * Spends the token from the emailed link. The verification page sends this
   * POST automatically when opened with a complete link.
   */
  public confirmEmail(input: ConfirmEmailInput): Observable<ConfirmEmailResult> {
    return this.http.post<ConfirmEmailResult>(this.confirmEmailAPI, input).pipe(first());
  }

  public login(input: LoginInput): Observable<boolean> {
    return this.http.post<LoginUser>(this.loginAPI, input).pipe(
      first(),
      switchMap((res) => this.tokenStorage.setUser(res)),
      switchMap((res) => this.tokenStorage.setAccessToken(res.token)),
    );
  }

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
      .subscribe(() => this.router.navigate(['welcome']));
  }
}
