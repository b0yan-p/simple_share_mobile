import { Component, inject, OnInit } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { NetworkService } from 'src/app/core/services/network.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { OfflineWarningComponent } from 'src/app/shared/components/offline-warning/offline-warning.component';
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
    IonSpinner,
    ListItemComponent,
    EmptyStateComponent,
    OfflineWarningComponent,
  ],
})
export class ConnectionListComponent implements OnInit {
  service = inject(ConnectionService);
  protected readonly network = inject(NetworkService);

  ngOnInit(): void {
    this.service.getAll();
  }
}
