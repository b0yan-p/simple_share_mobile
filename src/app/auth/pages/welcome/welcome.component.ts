import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { ToastService } from 'src/app/core/services/toast.service';
import { GoogleSignInButtonComponent } from 'src/app/shared/components/google-sign-in-button/google-sign-in-button.component';

import { addIcons } from 'ionicons';
import { mailOutline, personAddOutline } from 'ionicons/icons';
import { first } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { isGoogleSignInCancelled } from '../../services/google-auth.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  imports: [GoogleSignInButtonComponent, IonContent, IonIcon],
})
export class WelcomeComponent {
  auth = inject(AuthService);
  router = inject(Router);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  loading = false;

  /** Set by authGuard when a protected URL (e.g. an invite link) was blocked. */
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  constructor() {
    addIcons({ mailOutline, personAddOutline });
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

  /** returnUrl rides along so an invite link survives the email path too. */
  goToLogin() {
    this.router.navigate(['login'], {
      queryParams: this.returnUrl ? { returnUrl: this.returnUrl } : {},
    });
  }

  goToRegister() {}

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

    const body = err.error;

    if (typeof body === 'string') return body;
    if (typeof body?.detail === 'string') return body.detail;
    if (typeof body?.title === 'string') return body.title;

    return 'Google sign-in failed';
  }
}
