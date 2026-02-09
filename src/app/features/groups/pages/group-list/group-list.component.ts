import { Component, inject, OnInit } from '@angular/core';
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
import { ToastService } from 'src/app/core/services/toast.service';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { PaginatorComponent } from 'src/app/shared/components/paginator/paginator.component';
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
    ListItemComponent,
    PaginatorComponent,
  ],
})
export class GroupListComponent implements OnInit {
  router = inject(Router);
  service = inject(GroupService);
  toastService = inject(ToastService);

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
