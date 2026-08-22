import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { PaginateDirective } from 'src/app/shared/directives/paginate.directive';
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
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    ListItemComponent,
    EmptyStateComponent,
    PaginateDirective,
  ],
})
export class GroupListComponent implements OnInit {
  router = inject(Router);
  service = inject(GroupService);
  toastService = inject(ToastService);
  ui = inject(UiService);

  ngOnInit(): void {
    this.service.getAll();
  }

  onDelete(id: string) {
    this.service.delete(id).subscribe({
      next: () => this.toastService.successToast('Group deleted successfully!'),
      error: (err) => this.toastService.errorToast(err),
    });
  }
}
