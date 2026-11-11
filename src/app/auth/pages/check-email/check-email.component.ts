import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular/standalone';
import { first, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../services/auth.service';

/**
 * Where both ways into "your account is waiting on a confirmation" end up:
 * straight after registering, and after a login the API refused with
 * email_not_confirmed. The second case is the reason this page exists at all -
 * a user whose link never arrived had no way back to one except by filling in
 * the whole registration form again.
 */
@Component({
  selector: 'app-check-email',
  templateUrl: './check-email.component.html',
  styleUrls: ['./check-email.component.scss'],
  imports: [IonButton, IonContent, IonSpinner],
})
export class CheckEmailComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Dev-only, same idea as on the verify-email page: `?preview=sending`. */
  private readonly preview = environment.production
    ? null
    : this.route.snapshot.queryParamMap.get('preview');

  readonly email = this.route.snapshot.queryParamMap.get('email');
  readonly sending = signal(this.preview === 'sending');
  readonly cooldown = signal(0);
  readonly resendError = signal<string | null>(null);
  readonly resendSuccess = signal(false);

  private cooldownUntil = 0;

  constructor() {
    // Use elapsed time so returning from Gmail also updates a throttled timer.
    timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cooldown.set(Math.max(0, Math.ceil((this.cooldownUntil - Date.now()) / 1000)));
      });
  }

  resend() {
    if (this.preview !== null) return;

    if (!this.email || this.sending() || this.cooldown() > 0) return;

    this.sending.set(true);
    this.resendError.set(null);
    this.resendSuccess.set(false);
    this.auth
      .resendVerification(this.email)
      .pipe(first(), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sending.set(false);
          // The API answers the same way for an unknown address and for one
          // still inside its cooldown, so this is all the page can honestly say.
          this.resendSuccess.set(true);
          // Matches EmailVerificationService's existing one-minute cooldown.
          this.cooldownUntil = Date.now() + 60_000;
          this.cooldown.set(60);
        },
        error: (err) => {
          this.sending.set(false);

          console.error('Could not resend the confirmation email', err);
          this.resendError.set(this.errorMessage(err));
        },
      });
  }

  goToLogin() {
    this.router.navigate(['login'], { replaceUrl: true });
  }

  private errorMessage(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) return 'Could not send the email. Try again.';
    if (err.status === 0) return 'No connection. Check your network and try again.';

    const body = err.error;

    if (typeof body?.detail === 'string') return body.detail;

    return 'Could not send the email. Try again.';
  }
}
