import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { UiService } from 'src/app/core/services/ui.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { PaginatorComponent } from 'src/app/shared/components/paginator/paginator.component';
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
    ListItemComponent,
    EmptyStateComponent,
    PaginatorComponent,
  ],
})
export class ActivityListComponent {
  service = inject(ActivityService);
  ui = inject(UiService);
  private router = inject(Router);

  constructor() {
    this.service.getAll();
  }

  openDetails(item: ActivityListItem) {
    this.router.navigate(this.service.resolveNavigation(item.details));
  }
}
