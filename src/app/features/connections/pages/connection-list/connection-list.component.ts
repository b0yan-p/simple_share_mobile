import { Component, inject, OnInit } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'app-connection-list',
  templateUrl: './connection-list.component.html',
  styleUrls: ['./connection-list.component.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonIcon,
    IonSpinner,
    ListItemComponent,
  ],
})
export class ConnectionListComponent implements OnInit {
  service = inject(ConnectionService);

  ngOnInit(): void {
    this.service.getAll();
  }
}
