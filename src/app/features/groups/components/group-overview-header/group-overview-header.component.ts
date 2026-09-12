import { NgClass } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { GroupMember } from '../../models/group-member.model';
import { GroupOverview } from '../../models/group-overview.model';

@Component({
  selector: 'app-group-overview-header',
  templateUrl: './group-overview-header.component.html',
  styleUrls: ['./group-overview-header.component.scss'],
  imports: [IonRippleEffect, IonIcon, AvatarComponent, NgClass],
})
export class GroupOverviewHeaderComponent {
  readonly REDUCED_NUMBER_OF_MEMBERS: number = 3;

  group = input.required<GroupOverview>();
  members = input<GroupMember[]>();

  reducedMembers = computed(
    () => this.members()?.slice(0, this.REDUCED_NUMBER_OF_MEMBERS) ?? [],
  );
  /** How many members the capped stack leaves out, rendered as a "+N" bubble. */
  hiddenCount = computed(() =>
    Math.max(0, (this.members()?.length ?? 0) - this.REDUCED_NUMBER_OF_MEMBERS),
  );

  addMembers = output<void>();
  viewMembers = output<void>();

  totalPaid = input<number>(0);
  totalOwed = input<number>(0);
  totalBalance = input<number>(0);
}
