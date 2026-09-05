import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, arrowBackOutline, checkmarkCircle } from 'ionicons/icons';
import { catchError, filter, forkJoin, from, map, of, switchMap, tap } from 'rxjs';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { GroupMember, GroupRole, isVirtualMember } from '../../models/group-member.model';
import { GroupMemberFacade } from '../../services/group-member-facade.service';
import { GroupService } from '../../services/group.service';
import { AddMemberModalComponent } from '../add-member-modal/add-member-modal.component';
import { MemberActionsSheetComponent } from '../member-actions-sheet/member-actions-sheet.component';

@Component({
  selector: 'app-group-members-modal',
  templateUrl: './group-members-modal.component.html',
  styleUrls: ['./group-members-modal.component.scss'],
  standalone: true,
  imports: [
    AvatarComponent,
    ChipComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonList,
    IonItem,
    IonSpinner,
  ],
})
export class GroupMembersModalComponent implements OnInit {
  @Input({ required: true }) groupId!: string;
  /** The viewer's own member id, from GroupOverview.currentMemberId. */
  @Input() currentMemberId: string | null = null;

  private modalController = inject(ModalController);
  private groupMemberFacade = inject(GroupMemberFacade);
  private groupService = inject(GroupService);

  members = signal<GroupMember[]>([]);
  loading = signal(true);
  /** Non-zero right after a bulk add, driving the green confirmation banner. */
  addedCount = signal(0);

  /** Whether anything changed, so the caller knows to refresh its own list. */
  private changed = signal(false);

  private netByMemberId = signal(new Map<string, number>());

  withoutAccountCount = computed(() => this.members().filter((m) => isVirtualMember(m)).length);

  rows = computed(() =>
    this.members().map((member) => ({
      member,
      isOwner: member.groupRole === GroupRole.Owner,
      isVirtual: isVirtualMember(member),
    })),
  );

  /** Removal is owner-only on the backend, so don't offer it to anyone else. */
  private viewerIsOwner = computed(() =>
    this.members().some(
      (m) => m.memberId === this.currentMemberId && m.groupRole === GroupRole.Owner,
    ),
  );

  constructor() {
    addIcons({ addOutline, arrowBackOutline, checkmarkCircle });
  }

  ngOnInit(): void {
    this.load();
  }

  dismiss(): void {
    this.modalController.dismiss(null, this.changed() ? 'confirm' : 'cancel');
  }

  openAddPeople(): void {
    from(
      this.modalController.create({
        component: AddMemberModalComponent,
        componentProps: {
          groupId: this.groupId,
          existingMemberIds: this.members().map((m) => m.memberId),
        },
        breakpoints: [0, 0.92],
        initialBreakpoint: 0.92,
      }),
    )
      .pipe(
        switchMap((modal) => from(modal.present()).pipe(map(() => modal))),
        switchMap((modal) => from(modal.onWillDismiss())),
        filter(({ role }) => role === 'confirm'),
        tap(({ data }) => {
          this.addedCount.set(data?.addedCount ?? 0);
          this.changed.set(true);
          this.load();
        }),
      )
      .subscribe();
  }

  openMemberActions(member: GroupMember): void {
    from(
      this.modalController.create({
        component: MemberActionsSheetComponent,
        componentProps: {
          groupId: this.groupId,
          member,
          netBalance: this.netByMemberId().get(member.memberId) ?? null,
          canRemove: this.viewerIsOwner() && member.memberId !== this.currentMemberId,
        },
        breakpoints: [0, 0.65],
        initialBreakpoint: 0.65,
      }),
    )
      .pipe(
        switchMap((modal) => from(modal.present()).pipe(map(() => modal))),
        switchMap((modal) => from(modal.onWillDismiss())),
        filter(({ role, data }) => role === 'confirm' && !!data?.removed),
        tap(() => {
          this.addedCount.set(0);
          this.changed.set(true);
          this.load();
        }),
      )
      .subscribe();
  }

  private load(): void {
    this.loading.set(true);

    // Balances are decoration here: if that call fails the member list must
    // still render, so it collapses to null rather than erroring the pair.
    forkJoin({
      members: this.groupMemberFacade
        .getGroupMembers(this.groupId)
        .pipe(catchError(() => of([] as GroupMember[]))),
      balances: this.groupService
        .getGroupBalances(this.groupId)
        .pipe(catchError(() => of(null))),
    }).subscribe(({ members, balances }) => {
      this.members.set(members ?? []);
      this.netByMemberId.set(
        new Map((balances?.members ?? []).map((b) => [b.memberId, b.net])),
      );
      this.loading.set(false);
    });
  }
}
