import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { finalize, map } from 'rxjs';
import { PASSWORD_HINT, PASSWORD_PATTERN, passwordsMatch } from '../../password-policy';
import { AuthService } from '../../services/auth.service';
import { TokenStorageService } from '../../services/token-storage.service';

@Component({
  selector: 'app-reset-password',
  imports: [IonContent, IonIcon, IonInput, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: '../../styles/_auth-page.scss',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly sessions = inject(TokenStorageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly link = toSignal(
    inject(ActivatedRoute).fragment.pipe(
      map((fragment) => {
        const params = new URLSearchParams(fragment ?? '');
        const userId = params.get('userId') ?? '';
        const token = params.get('token') ?? '';
        return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(userId) &&
          /^[A-Za-z0-9_-]{1,2048}$/.test(token)
          ? { userId, token }
          : null;
      }),
    ),
    { initialValue: null },
  );
  protected readonly signedIn = computed(() => this.sessions.isAuthenticated());
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      newPassword: [
        '',
        [Validators.required, Validators.pattern(PASSWORD_PATTERN), Validators.maxLength(1024)],
      ],
      repeatPassword: ['', Validators.required],
    },
    { validators: passwordsMatch('newPassword') },
  );
  protected readonly passwordHint = PASSWORD_HINT;
  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly invalidLink = signal(false);
  protected readonly error = signal('');
  protected readonly newPasswordVisible = signal(false);
  protected readonly repeatPasswordVisible = signal(false);

  constructor() {
    addIcons({ eyeOffOutline, eyeOutline });
  }

  protected fieldError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!control.touched) return '';
    if (control.hasError('required')) {
      return field === 'newPassword' ? 'Enter a new password.' : 'Repeat your new password.';
    }
    if (field === 'repeatPassword') {
      return this.form.hasError('passwordsMismatch') ? 'Passwords do not match.' : '';
    }
    if (control.hasError('maxlength')) return 'Use at most 1024 characters.';
    return control.invalid ? PASSWORD_HINT : '';
  }

  protected signOut(): void {
    if (this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    this.auth
      .clearSession()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({ error: () => this.error.set('Could not sign out. Please try again.') });
  }

  protected resetPassword(): void {
    const link = this.link();
    if (!link || this.invalidLink() || this.signedIn() || this.busy()) return;

    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.auth
      .resetPassword({ ...link, newPassword: this.form.controls.newPassword.value })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.form.reset();
          this.done.set(true);
        },
        error: (error: unknown) => {
          if (
            error instanceof HttpErrorResponse &&
            error.error?.code === 'invalid_reset_token'
          ) {
            this.form.reset();
            this.invalidLink.set(true);
          } else if (
            error instanceof HttpErrorResponse &&
            error.error?.code === 'invalid_new_password'
          ) {
            const password = this.form.controls.newPassword;
            password.setErrors({ policy: true });
            password.markAsTouched();
          } else {
            this.error.set('Could not reset your password. Please try again.');
          }
        },
      });
  }
}
