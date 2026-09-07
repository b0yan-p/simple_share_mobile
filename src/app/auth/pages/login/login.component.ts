import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonButtons,
  IonHeader,
  IonBackButton,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { LoginInput } from '../../models/login-input.model';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenStorageService } from '../../services/token-storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    IonButton,
    IonInput,
    IonContent,
    ReactiveFormsModule,
    IonInputPasswordToggle,
    RouterLink,
  ],
})
export class LoginComponent {
  auth = inject(AuthService);
  tokenService = inject(TokenStorageService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;

  /** Set by authGuard when a protected URL (e.g. an invite link) was blocked. */
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  form = new FormGroup({
    email: new FormControl<string | null>('pero@peric.com', [
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
        if (!res) return;

        this.loading = false;
        // navigateByUrl, not navigate: returnUrl is a whole URL, not a segment.
        this.router.navigateByUrl(this.returnUrl ?? '/home');
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }
}
