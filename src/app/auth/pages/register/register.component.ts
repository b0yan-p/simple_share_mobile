import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
} from '@ionic/angular/standalone';

import { RegisterInput } from '../../models/register-input.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    IonButton,
    IonInput,
    IonContent,
    ReactiveFormsModule,
    IonInputPasswordToggle,
    RouterLink,
  ],
})
export class RegisterComponent {
  auth = inject(AuthService);
  router = inject(Router);

  loading = false;

  form = new FormGroup(
    {
      firstName: new FormControl<string | null>('', [Validators.required]),
      lastName: new FormControl<string | null>('', [Validators.required]),
      email: new FormControl<string | null>('', [Validators.required, Validators.email]),
      password: new FormControl<string | null>('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      repeatPassword: new FormControl<string | null>('', [Validators.required]),
    },
    { validators: passwordsMatch },
  );

  register() {
    if (this.form.invalid || this.loading) {
      // TODO implement snackbar here
      console.error('Form is invalid');
      return;
    }

    this.loading = true;
    this.auth.register(this.form.value as RegisterInput).subscribe({
      next: (res) => {
        if (!res) return;

        this.loading = false;
        this.router.navigate(['home']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }
}

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const repeatPassword = control.get('repeatPassword')?.value;
  return password === repeatPassword ? null : { mismatch: true };
}
