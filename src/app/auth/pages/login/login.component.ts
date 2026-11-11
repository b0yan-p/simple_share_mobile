import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
  NavController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons';
import { first } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { GoogleSignInButtonComponent } from 'src/app/shared/components/google-sign-in-button/google-sign-in-button.component';
import { AuthService } from '../../services/auth.service';
import { isGoogleSignInCancelled } from '../../services/google-auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    GoogleSignInButtonComponent,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonSpinner,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly googleLoading = signal(false);
  readonly passwordVisible = signal(false);

  /** Set by authGuard when a protected URL (e.g. an invite link) was blocked. */
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  constructor() {
    addIcons({ chevronBackOutline, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline });
  }

  /** Errors stay hidden until the field has been used. */
  isInvalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];

    return control.invalid && (control.touched || control.dirty);
  }

  errorFor(name: keyof typeof this.form.controls): string | null {
    if (!this.isInvalid(name)) return null;

    const control = this.form.controls[name];

    if (control.hasError('required')) {
      return name === 'email' ? 'Email is required.' : 'Password is required.';
    }

    if (control.hasError('email')) return 'Enter a valid email address.';

    return null;
  }

  goBack() {
    this.navController.navigateBack('/welcome');
  }

  togglePassword() {
    this.passwordVisible.update((visible) => !visible);
  }

  login() {
    if (this.loading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth
      .login(this.form.getRawValue())
      .pipe(first())
      .subscribe({
        next: () => {
          this.loading.set(false);
          // navigateByUrl, not navigate: returnUrl is a whole URL, not a segment.
          this.router.navigateByUrl(this.returnUrl ?? '/home', { replaceUrl: true });
        },
        error: (err) => {
          this.loading.set(false);

          console.error('Login failed', err);

          // Not a dead end: the account exists and the password was right, it
          // is only waiting on a confirmation the user may never have received.
          if (this.errorCode(err) === 'email_not_confirmed') {
            this.router.navigate(['check-email'], {
              queryParams: { email: this.form.getRawValue().email },
            });
            return;
          }

          this.toastService.errorToast(this.errorMessage(err, 'Login failed'));
        },
      });
  }

  forgotPassword() {
    // Password recovery lands here once the backend endpoint exists.
  }

  goToRegister() {
    this.router.navigate(['register'], {
      queryParams: this.returnUrl ? { returnUrl: this.returnUrl } : {},
    });
  }

  loginWithGoogle() {
    if (this.googleLoading()) return;

    this.googleLoading.set(true);
    this.auth
      .googleLogin()
      .pipe(first())
      .subscribe({
        next: (res) => {
          if (!res) return;

          this.googleLoading.set(false);
          // navigateByUrl, not navigate: returnUrl is a whole URL, not a segment.
          this.router.navigateByUrl(this.returnUrl ?? '/home', { replaceUrl: true });
        },
        error: (err) => {
          this.googleLoading.set(false);

          // Dismissing the Google dialog is a choice, not a failure.
          if (isGoogleSignInCancelled(err)) return;

          console.error('Google sign-in failed', err);
          this.toastService.errorToast(this.errorMessage(err, 'Google sign-in failed'));
        },
      });
  }

  /** The `code` extension on problem+json - the string the app branches on. */
  private errorCode(err: unknown): string | null {
    return err instanceof HttpErrorResponse && typeof err.error?.code === 'string'
      ? err.error.code
      : null;
  }

  /**
   * The API answers with problem+json, so the readable part is `detail` - the
   * status code and trace id stay in the console, where they are of use.
   */
  private errorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) return (err as Error)?.message || fallback;

    if (err.status === 0) return 'No connection. Check your network and try again.';

    const body = err.error;

    if (typeof body === 'string') return body;
    if (typeof body?.detail === 'string') return body.detail;
    if (typeof body?.title === 'string') return body.title;

    return fallback;
  }
}
