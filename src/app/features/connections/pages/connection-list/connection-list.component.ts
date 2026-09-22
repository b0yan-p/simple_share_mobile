import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { Observable } from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { OfflineEmptyStateComponent } from 'src/app/shared/components/offline-empty-state/offline-empty-state.component';
import { RefreshDirective } from 'src/app/shared/directives/refresher.directive';
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
    IonRefresher,
    IonRefresherContent,
    ListItemComponent,
    EmptyStateComponent,
    OfflineEmptyStateComponent,
    RefreshDirective,
  ],
})
export class ConnectionListComponent implements ViewWillEnter {
  service = inject(ConnectionService);
  protected readonly network = inject(NetworkService);

  /**
   * Ionic keeps this tab page alive, so ngOnInit does not run again on re-entry.
   * The list has no freshness state, so every entry reloads from here.
   * Offline we skip the request entirely — the template shows the offline state.
   */
  ionViewWillEnter(): void {
    if (!this.network.isOnline()) {
      return;
    }

    this.service.getAll();
  }

  readonly onRefresh = (): Observable<void> => this.service.refreshList();
}
