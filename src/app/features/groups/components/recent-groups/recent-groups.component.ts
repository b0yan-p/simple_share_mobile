import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonList } from '@ionic/angular/standalone';
import { ListItemCardComponent } from 'src/app/shared/components/list-item-card/list-item-card.component';
import { ListItemComponent } from 'src/app/shared/components/list-item/list-item.component';
import { GroupListItem } from '../../models/group.model';

@Component({
  selector: 'app-recent-groups',
  templateUrl: './recent-groups.component.html',
  styleUrls: ['./recent-groups.component.scss'],
  imports: [IonList, IonButton, ListItemComponent, ListItemCardComponent],
})
export class RecentGroupsComponent implements OnInit {
  router = inject(Router);
  // TODO implement fetching recent groups
  groups = TEST_DATA;

  constructor() {}

  ngOnInit() {}

  navigateToGroups() {
    this.router.navigate(['groups']);
  }

  navigateToGroupDetails(groupId: string) {
    this.router.navigate(['groups', groupId, 'details']);
  }
}

const TEST_DATA: GroupListItem[] = [
  {
    id: '112dcb1e-9a34-430d-a6df-61bb44aa49b3',
    name: 'Test grupa 1',
    simplifyDebts: true,
    createdAt: new Date('2026-02-01T22:09:24.213441'),
    deletedAt: null,
  },
  {
    id: '1e654e8b-a88a-4816-889e-1854b9d958d3',
    name: 'Group 1.',
    simplifyDebts: true,
    createdAt: new Date('2025-12-30T15:48:48.082661'),
    deletedAt: null,
  },
  {
    id: 'e85dd061-3ad5-4d9e-8b8f-49e2a2e50b4f',
    name: 'Grupa membera 1 - Update',
    simplifyDebts: false,
    createdAt: new Date('2026-01-13T08:56:55.314854'),
    deletedAt: null,
  },
];
