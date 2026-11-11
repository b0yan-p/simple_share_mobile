import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular/standalone';
import { first } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../services/auth.service';

type Stage = 'ready' | 'confirming' | 'confirmed' | 'failed';

/**
 * Where the link in the confirmation email lands when the app is installed -
 * Android verifies https://<api host>/verify-email as an App Link and hands the
 * URL here instead of to a browser. Without the app, the same URL is answered
 * by the backend's own page, which does the same thing.
 *
 * Opening a complete link automatically submits the confirmation token.
 * A failed request can be retried without reopening the email.
 */
@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  imports: [IonButton, IonContent, IonSpinner],
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly userId = this.route.snapshot.queryParamMap.get('userId');
  private readonly token = this.route.snapshot.queryParamMap.get('token');

  /**
   * Dev-only: `?preview=incomplete|ready|confirming|confirmed|failed` paints
   * one state with nothing behind it, so the page can be styled without
   * round-tripping a real email. Always null in a production build, which
   * makes every branch reading it unreachable there.
   */
  private readonly preview = environment.production
    ? null
    : this.route.snapshot.queryParamMap.get('preview');

  /** Incomplete links never send a confirmation request. */
  readonly linkComplete =
    this.preview !== null ? this.preview !== 'incomplete' : !!this.userId && !!this.token;

  readonly stage = signal<Stage>(
    this.preview === 'confirming' || this.preview === 'confirmed' || this.preview === 'failed'
      ? this.preview
      : 'ready',
  );

  readonly error = signal<string | null>(
    this.preview === 'failed' ? 'This link is not valid or has expired.' : null,
  );

  ngOnInit() {
    this.confirm();
  }

  confirm() {
    // A previewed state is a painting, not a flow - clicking must not fire a
    // request against a userId and token that were never there.
    if (this.preview !== null) return;

    if (
      !this.userId ||
      !this.token ||
      this.stage() === 'confirming' ||
      this.stage() === 'confirmed'
    )
      return;

    this.stage.set('confirming');
    this.error.set(null);

    this.auth
      .confirmEmail({ userId: this.userId, token: this.token })
      .pipe(first(), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.stage.set('confirmed'),
        error: (err) => {
          console.error('Email confirmation failed', err);

          this.error.set(this.errorMessage(err));
          this.stage.set('failed');
        },
      });
  }

  goToLogin() {
    this.router.navigate(['login'], { replaceUrl: true });
  }

  /** Same shape as the other auth pages: problem+json carries the readable part in `detail`. */
  private errorMessage(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) {
      return 'Could not confirm your email. Try again.';
    }

    if (err.status === 0) return 'No connection. Check your network and try again.';

    const body = err.error;

    if (typeof body === 'string') return body;
    if (typeof body?.detail === 'string') return body.detail;

    return 'This link is not valid or has expired.';
  }
}
