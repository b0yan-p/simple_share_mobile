import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline } from 'ionicons/icons';

@Component({
  selector: 'app-offline-warning',
  templateUrl: './offline-warning.component.html',
  styleUrls: ['./offline-warning.component.scss'],
  imports: [IonIcon],
})
export class OfflineWarningComponent {
  mode = input<'info' | 'indicator'>('info');
  readonly cloudOfflineOutline = cloudOfflineOutline;

  constructor() {
    addIcons({
      cloudOfflineOutline,
    });
  }
}
