import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  imports: [
    IonIcon,
    IonFabButton,
    IonFab,
    IonHeader,
    RouterModule,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
  ],
})
export class GroupListComponent {}
