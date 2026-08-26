import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-offline-empty-state',
  templateUrl: './offline-empty-state.component.html',
  styleUrls: ['./offline-empty-state.component.scss'],
  imports: [IonButton],
})
export class OfflineEmptyStateComponent {
  title = input<string>("You're offline");
  showNavigation = input<boolean>(true);
  navigationLabel = input<string>('View saved groups');
  navigationRoute = input<string[]>(['groups']);

  router = inject(Router);

  navigate() {
    this.router.navigate(this.navigationRoute());
  }
}
