import { apiErrorMessage } from 'src/app/core/services/api-error';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonInput } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [IonContent, IonInput, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../../styles/_auth-page.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: [
      this.prefilledEmail(),
      [Validators.required, Validators.email, Validators.maxLength(256)],
    ],
  });
  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal('');

  private prefilledEmail(): string {
    const info = inject(Router).currentNavigation()?.extras.info;
    return typeof info === 'string' ? info : '';
  }

  protected send(): void {
    if (this.sending() || this.sent()) return;

    const email = this.form.controls.email;
    email.setValue(email.value.trim());
    if (email.invalid) {
      email.markAsTouched();
      return;
    }

    this.error.set('');
    this.sending.set(true);
    this.auth
      .forgotPassword(email.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.sending.set(false)),
      )
      .subscribe({
        next: () => this.sent.set(true),
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, 'Could not submit the request. Please try again.')),
      });
  }
}
