import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [IonButton, IonContent, IonTitle, IonToolbar, IonHeader],
})
export class SettingsComponent {
  auth = inject(AuthService);

  logout() {
    this.auth.logout();
  }
}
