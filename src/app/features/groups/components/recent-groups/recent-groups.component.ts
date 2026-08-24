import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonList } from '@ionic/angular/standalone';
import { LoadStatus } from 'src/app/core/store/models/list-state.model';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { GroupFacade } from '../../services/group-facade.service';

@Component({
  selector: 'app-recent-groups',
  templateUrl: './recent-groups.component.html',
  styleUrls: ['./recent-groups.component.scss'],
  imports: [IonList, IonButton, ListItemComponent, EmptyStateComponent],
})
export class RecentGroupsComponent {
  router = inject(Router);
  facade = inject(GroupFacade);

  readonly loading = computed(() => this.facade.recentStore.status() === LoadStatus.Loading);

  navigateToGroups() {
    this.router.navigate(['groups']);
  }

  navigateToGroupDetails(groupId: string) {
    this.router.navigate(['groups', groupId, 'details']);
  }
}
