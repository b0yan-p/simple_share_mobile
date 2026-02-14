import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { PaginatorComponent } from 'src/app/shared/components/paginator/paginator.component';
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
    DatePipe,
    PaginatorComponent,
  ],
})
export class ActivityListComponent {
  service = inject(ActivityService);

  constructor() {
    this.service.getAll();
  }

  openDetails() {
    console.log('show bottom sheet details');
  }
}
