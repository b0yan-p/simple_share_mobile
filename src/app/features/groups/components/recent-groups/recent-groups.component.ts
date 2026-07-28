import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonList } from '@ionic/angular/standalone';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { GroupListItem } from '../../models/group.model';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-recent-groups',
  templateUrl: './recent-groups.component.html',
  styleUrls: ['./recent-groups.component.scss'],
  imports: [IonList, IonButton, ListItemComponent, EmptyStateComponent],
})
export class RecentGroupsComponent implements OnInit {
  router = inject(Router);
  private groupService = inject(GroupService);

  groups = signal<GroupListItem[]>([]);
  loaded = signal(false);

  ngOnInit() {
    this.groupService.getRecentGroups().subscribe((groups) => {
      this.groups.set(groups);
      this.loaded.set(true);
    });
  }

  navigateToGroups() {
    this.router.navigate(['groups']);
  }

  navigateToGroupDetails(groupId: string) {
    this.router.navigate(['groups', groupId, 'details']);
  }
}
