import { NgClass } from '@angular/common';
import { Component, computed, input, OnInit } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { GroupMember } from '../../models/group-member.model';
import { GroupOverview } from '../../models/group-overview.model';

@Component({
  selector: 'app-group-overview-header',
  templateUrl: './group-overview-header.component.html',
  styleUrls: ['./group-overview-header.component.scss'],
  imports: [IonButton, AvatarComponent, NgClass],
})
export class GroupOverviewHeaderComponent implements OnInit {
  group = input.required<GroupOverview>();
  members = input<GroupMember[]>();
  reducedMembers = computed(() => this.members()?.slice(0, 5) ?? []);

  totalPaid = input<number>(0);
  totalOwed = input<number>(0);
  totalBalance = input<number>(0);

  constructor() {}

  ngOnInit() {}
}
