import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
} from '@ionic/angular/standalone';
import { LoginInput } from '../../models/login-input.model';

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenStorageService } from '../../services/token-storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [IonButton, IonInput, IonContent, ReactiveFormsModule, IonInputPasswordToggle],
})
export class LoginComponent {
  auth = inject(AuthService);
  tokenService = inject(TokenStorageService);
  router = inject(Router);

  loading = false;

  form = new FormGroup({
    email: new FormControl<string | null>('pera@zdera', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl<string | null>('Mojal1', [Validators.required]),
  });

  login() {
    if (this.form.invalid || this.loading) {
      // TODO implement snackbar here
      console.error('Form is invalid');
      return;
    }

    this.loading = true;
    this.auth.login(this.form.value as LoginInput).subscribe({
      next: (res) => {
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
