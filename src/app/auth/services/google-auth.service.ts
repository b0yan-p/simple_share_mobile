import { Injectable } from '@angular/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { defer, from, map, Observable, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Wraps the native Google dialog. The plugin is the only promise based and
 * platform specific piece of this flow, so it stays behind this service and
 * AuthService keeps dealing in observables only.
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private initialized = false;

  /** Opens the native Google dialog and resolves with the idToken for the backend. */
  signIn(): Observable<string> {
    return this.ensureInitialized().pipe(
      switchMap(() => from(SocialLogin.login({ provider: 'google', options: {} }))),
      map(({ result }) => {
        // Online mode always returns a payload with an idToken; the offline
        // branch of the union only carries a serverAuthCode, which this app
        // never asks for.
        const idToken = 'idToken' in result ? result.idToken : null;
        if (!idToken) throw new Error('Google returned no idToken');

        return idToken;
      }),
    );
  }

  /**
   * Ends the Google session on the device. Without it the next sign in skips
   * account selection and silently returns the same user, which reads as a
   * broken logout.
   */
  signOut(): Observable<void> {
    if (!this.initialized) return of(void 0);

    return from(SocialLogin.logout({ provider: 'google' })).pipe(map(() => void 0));
  }

  private ensureInitialized(): Observable<void> {
    if (this.initialized) return of(void 0);

    // defer so initialize() runs on subscribe, not when the pipe is built.
    return defer(() =>
      from(
        SocialLogin.initialize({
          google: { webClientId: environment.googleClientId },
        }),
      ),
    ).pipe(
      map(() => {
        this.initialized = true;
      }),
    );
  }
}

/**
 * True when the user dismissed the Google dialog. The plugin normalises every
 * cancellation path to this code, and it is an expected outcome - callers stop
 * their loading state and show nothing.
 */
export const isGoogleSignInCancelled = (err: unknown): boolean =>
  (err as { code?: string } | null)?.code === 'USER_CANCELLED';
