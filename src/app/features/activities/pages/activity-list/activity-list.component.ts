import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { NetworkService } from 'src/app/core/services/network.service';
import { UiService } from 'src/app/core/services/ui.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { OfflineEmptyStateComponent } from 'src/app/shared/components/offline-empty-state/offline-empty-state.component';
import { PaginateDirective } from 'src/app/shared/directives/paginate.directive';
import { ActivityListItem } from '../../models/activity.model';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss'],
  imports: [
    IonList,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    ListItemComponent,
    EmptyStateComponent,
    PaginateDirective,
    OfflineEmptyStateComponent,
  ],
})
export class ActivityListComponent implements ViewWillEnter {
  service = inject(ActivityService);
  ui = inject(UiService);
  protected readonly network = inject(NetworkService);
  private router = inject(Router);

  /**
   * Ionic keeps this tab page alive, so the constructor does not run again on re-entry.
   * The list has no freshness state, so every entry reloads from here.
   * Offline we skip the request entirely — the template shows the offline state.
   */
  ionViewWillEnter(): void {
    if (!this.network.isOnline()) return;

    this.service.getAll();
  }

  openDetails(item: ActivityListItem) {
    this.router.navigate(this.service.resolveNavigation(item.details));
  }
}
