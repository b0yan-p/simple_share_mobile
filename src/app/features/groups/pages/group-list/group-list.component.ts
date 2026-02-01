import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  imports: [
    IonList,
    IonIcon,
    IonFabButton,
    IonFab,
    IonHeader,
    RouterModule,
    IonToolbar,
    IonTitle,
    IonContent,
    AsyncPipe,
    ListItemComponent,
  ],
})
export class GroupListComponent {
  service = inject(GroupService);
  router = inject(Router);

  groups$ = this.service.getAll();

  onDelete() {
    // TODO implement delete group
    console.log('delete group');
  }
}
