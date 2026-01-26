import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  imports: [IonHeader, RouterModule, IonToolbar, IonTitle, IonContent, IonButton],
})
export class GroupListComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
