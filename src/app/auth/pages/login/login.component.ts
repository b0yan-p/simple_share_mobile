import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';

import { first } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { isGoogleSignInCancelled } from '../../services/google-auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [IonButton, IonIcon, IonContent],
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  loading = false;

  /** Set by authGuard when a protected URL (e.g. an invite link) was blocked. */
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  constructor() {
    addIcons({ logoGoogle });
  }

  loginWithGoogle() {
    if (this.loading) return;

    this.loading = true;
    this.auth
      .googleLogin()
      .pipe(first())
      .subscribe({
        next: (res) => {
          if (!res) return;

          this.loading = false;
          // navigateByUrl, not navigate: returnUrl is a whole URL, not a segment.
          this.router.navigateByUrl(this.returnUrl ?? '/home', { replaceUrl: true });
        },
        error: (err) => {
          this.loading = false;

          // Dismissing the Google dialog is a choice, not a failure.
          if (isGoogleSignInCancelled(err)) return;

          console.error('Google sign-in failed', err);
          this.toastService.errorToast(this.signInErrorMessage(err));
        },
      });
  }

  /**
   * Two very different failures land here: the native dialog refusing to open
   * (a plain Error carrying the plugin's own message, which names the Google
   * configuration at fault) and the API rejecting the token afterwards.
   */
  private signInErrorMessage(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) {
      return (err as Error)?.message || 'Google sign-in failed';
    }

    if (err.status === 0) return 'No connection. Check your network and try again.';

    const detail = this.serverMessage(err);
    const traceId = err.error?.traceId;

    return [
      detail ?? 'Sign-in failed',
      `(${err.status}${err.statusText ? ' ' + err.statusText : ''})`,
      traceId ? `· ${traceId}` : null,
    ]
      .filter(Boolean)
      .join(' ');
  }

  /**
   * The API answers in three different shapes: problem+json (validation and
   * anything through GlobalExceptionHandler), a bare string, and an Identity
   * error array. A bare string also arrives wrapped, because HttpClient parses
   * as JSON by default and stores the raw body under `text` when that fails.
   */
  private serverMessage(err: HttpErrorResponse): string | null {
    const body = err.error;
    if (!body) return null;

    if (typeof body === 'string') return body;

    // problem+json
    if (typeof body.detail === 'string') return body.detail;
    if (typeof body.title === 'string') return body.title;

    // non-JSON body that failed to parse
    if (typeof body.text === 'string' && body.text.trim()) return body.text;

    // IdentityError[] - [{ code, description }]
    if (Array.isArray(body)) {
      const descriptions = body
        .map((e) => e?.description)
        .filter((d): d is string => typeof d === 'string');

      if (descriptions.length) return descriptions.join(' ');
    }

    return null;
  }
}
