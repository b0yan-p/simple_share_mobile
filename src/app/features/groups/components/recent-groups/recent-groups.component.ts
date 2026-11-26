import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonList, IonSpinner } from '@ionic/angular/standalone';
import { NetworkService } from 'src/app/core/services/network.service';
import { apiErrorMessage } from 'src/app/core/services/api-error';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadStatus } from 'src/app/core/store/models/list-state.model';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { GroupFacade } from '../../services/group-facade.service';

@Component({
  selector: 'app-recent-groups',
  templateUrl: './recent-groups.component.html',
  styleUrls: ['./recent-groups.component.scss'],
  imports: [IonList, IonButton, IonSpinner, ListItemComponent, EmptyStateComponent],
})
export class RecentGroupsComponent {
  router = inject(Router);
  facade = inject(GroupFacade);
  network = inject(NetworkService);
  toastService = inject(ToastService);

  readonly loading = computed(() => this.facade.recentStore.status() === LoadStatus.Loading);

  navigateToGroups() {
    this.router.navigate(['groups']);
  }

  navigateToGroupDetails(groupId: string) {
    this.router.navigate(['groups', groupId, 'details']);
  }

  navigateToEditGroup(groupId: string) {
    this.router.navigate(['groups', groupId]);
  }

  onDelete(groupId: string) {
    this.facade.deleteGroup(groupId).subscribe({
      next: () => this.toastService.successToast('Group deleted successfully!'),
      error: (err) =>
        this.toastService.errorToast(apiErrorMessage(err, 'Could not delete group.')),
    });
  }
}
