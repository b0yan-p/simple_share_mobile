import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
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
  personOutline,
} from 'ionicons/icons';
import { first } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { GoogleSignInButtonComponent } from 'src/app/shared/components/google-sign-in-button/google-sign-in-button.component';
import { AuthService } from '../../services/auth.service';
import { isGoogleSignInCancelled } from '../../services/google-auth.service';

/** Mirrors the backend's Identity rules (Program.cs): 6+, upper, lower, digit. */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

/** Group level, because it compares two controls. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const repeat = group.get('repeatPassword')?.value;

  return !repeat || password === repeat ? null : { passwordsMismatch: true };
}

const REQUIRED_MESSAGES: Record<string, string> = {
  firstName: 'First name is required.',
  lastName: 'Last name is required.',
  email: 'Email is required.',
  password: 'Password is required.',
  repeatPassword: 'Repeat your password.',
};

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    GoogleSignInButtonComponent,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonSpinner,
  ],
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      repeatPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  readonly loading = signal(false);
  readonly googleLoading = signal(false);
  readonly passwordVisible = signal(false);
  readonly repeatPasswordVisible = signal(false);

  /** Set by authGuard when a protected URL (e.g. an invite link) was blocked. */
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  constructor() {
    addIcons({
      chevronBackOutline,
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      mailOutline,
      personOutline,
    });
  }

  goBack() {
    this.navController.navigateBack('/welcome');
  }

  togglePassword() {
    this.passwordVisible.update((visible) => !visible);
  }

  toggleRepeatPassword() {
    this.repeatPasswordVisible.update((visible) => !visible);
  }

  register() {
    if (this.loading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth
      .register(this.form.getRawValue())
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          // Registering no longer signs anyone in, so there is nowhere in the
          // app to go - the account is unusable until the link is followed.
          this.router.navigate(['check-email'], {
            queryParams: { email: result.email },
            replaceUrl: true,
          });
        },
        error: (err) => {
          this.loading.set(false);

          console.error('Registration failed', err);
          this.toastService.errorToast(this.errorMessage(err, 'Could not create account'));
        },
      });
  }

  /** Errors stay hidden until the field has been used or the form submitted. */
  isInvalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    const shown = control.touched || control.dirty;

    if (name === 'repeatPassword' && shown && this.form.hasError('passwordsMismatch'))
      return true;

    return control.invalid && shown;
  }

  errorFor(name: keyof typeof this.form.controls): string | null {
    if (!this.isInvalid(name)) return null;

    const control = this.form.controls[name];

    if (control.hasError('required')) return REQUIRED_MESSAGES[name];
    if (control.hasError('email')) return 'Enter a valid email address.';
    if (control.hasError('pattern')) {
      return 'At least 6 characters, with an uppercase letter, a lowercase letter and a number.';
    }

    if (name === 'repeatPassword' && this.form.hasError('passwordsMismatch')) {
      return 'Passwords do not match.';
    }

    return null;
  }

  goToLogin() {
    this.router.navigate(['login'], {
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
