import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { AdvanceInputDirective } from '../advance-input.directive';
import { HttpErrorResponse } from '@angular/common/http';
import { PASSWORD_HINT, PASSWORD_PATTERN, passwordsMatch } from 'src/app/auth/password-policy';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

type PasswordField = 'currentPassword' | 'newPassword' | 'repeatPassword';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrl: '../settings-form-dialog.scss',
  imports: [
    AdvanceInputDirective,
    ReactiveFormsModule,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonModal,
    IonTitle,
    IonToolbar,
  ],
})
export class ChangePasswordDialogComponent {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly breakpoints = [0, 1];
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly passwordOpen = signal(false);
  protected readonly passwordSaving = signal(false);
  protected readonly passwordError = signal('');
  protected readonly passwordFields = [
    { name: 'currentPassword', label: 'Current password' },
    { name: 'newPassword', label: 'New password' },
    { name: 'repeatPassword', label: 'Repeat new password' },
  ] as const;
  protected readonly visiblePasswords = signal<Partial<Record<PasswordField, boolean>>>({});

  protected readonly canDismissPassword = async () => !this.passwordSaving();
  protected readonly passwordForm = inject(FormBuilder).nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      repeatPassword: ['', Validators.required],
    },
    { validators: passwordsMatch('newPassword') },
  );

  constructor() {
    addIcons({ closeOutline, eyeOutline, eyeOffOutline });
  }

  open(): void {
    this.passwordOpen.set(true);
  }

  protected togglePassword(field: PasswordField): void {
    this.visiblePasswords.update((visible) => ({ ...visible, [field]: !visible[field] }));
  }

  protected fieldError(field: PasswordField): string {
    const control = this.passwordForm.controls[field];
    if (!control.touched && !control.dirty) return '';
    if (control.hasError('required')) {
      return {
        currentPassword: 'Enter your current password.',
        newPassword: 'Enter your new password.',
        repeatPassword: 'Repeat your new password.',
      }[field];
    }
    if (control.hasError('incorrect')) return 'Current password is incorrect.';
    if (control.hasError('pattern') || control.hasError('policy')) return PASSWORD_HINT;
    if (field === 'repeatPassword' && this.passwordForm.hasError('passwordsMismatch')) {
      return 'Passwords do not match.';
    }
    return '';
  }

  protected dismissPassword(): void {
    this.passwordOpen.set(false);
    this.visiblePasswords.set({});
    this.passwordForm.reset();
    this.passwordError.set('');
  }

  protected changePassword(): void {
    if (this.passwordSaving()) return;
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;
    this.passwordError.set('');
    this.passwordSaving.set(true);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.auth
      .changePassword({ currentPassword, newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.passwordSaving.set(false);
          this.dismissPassword();
          void this.toast.successToast('Password changed.');
        },
        error: (error: HttpErrorResponse) => {
          this.passwordSaving.set(false);
          const controls = this.passwordForm.controls;
          switch (error.error?.code) {
            case 'incorrect_current_password':
              controls.currentPassword.setErrors({ incorrect: true });
              break;
            case 'invalid_new_password':
              controls.newPassword.setErrors({ policy: true });
              break;
            default:
              this.passwordError.set(
                error.status === 0
                  ? 'Connection lost. The password change could not be confirmed.'
                  : 'Could not change your password. Please try again.',
              );
          }
        },
      });
  }
}
