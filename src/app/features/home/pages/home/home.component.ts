import { Component, inject } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { GroupStore } from 'src/app/features/groups/store/group-store';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [IonContent, IonTitle, IonToolbar, IonHeader],
})
export class HomeComponent {
  store = inject(GroupStore);

  constructor() {
    this.store.load();
  }
}
