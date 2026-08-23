import { Component, computed, inject } from '@angular/core';
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
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { NetworkService } from 'src/app/core/services/network.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadStatus } from 'src/app/core/store/models/list-state.model';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { PaginateDirective } from 'src/app/shared/directives/paginate.directive';
import { GroupFacade } from '../../services/group-facade.service';
import { GroupPaginatorService } from '../../services/group-paginator.service';

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
export class GroupListComponent implements ViewWillEnter {
  router = inject(Router);
  facade = inject(GroupFacade);
  paginator = inject(GroupPaginatorService);
  toastService = inject(ToastService);
  network = inject(NetworkService);

  /**
   * Read off the store rather than the global UiService.listLoading: that signal
   * is shared with the activity and expense lists, so a group fetch settling
   * would flip their loading state too.
   */
  readonly loading = computed(() => this.facade.store.status() === LoadStatus.Loading);

  /** Offline with nothing cached: offering "create a group" would only be rejected. */
  readonly offlineAndEmpty = computed(
    () => !this.network.isOnline() && this.facade.store.items().length === 0,
  );

  /**
   * Ionic keeps this tab page alive, so ngOnInit does not run again on re-entry.
   * The list has no freshness state, so every entry reloads from here.
   */
  ionViewWillEnter(): void {
    this.facade.loadGroups();
  }

  onDelete(id: string) {
    this.facade.deleteGroup(id).subscribe({
      next: () => this.toastService.successToast('Group deleted successfully!'),
      error: (err) => this.toastService.errorToast(err.message),
    });
  }
}
