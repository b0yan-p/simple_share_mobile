import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, Input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, trashOutline } from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { GroupMember, isGroupOwner, isVirtualMember } from '../../models/group-member.model';
import { GroupService } from '../../services/group.service';

/**
 * Messages for the rules enforced in GroupMemberService.RemoveGroupMemberAsync.
 * The backend surfaces them as the `code` extension on its ProblemDetails body.
 */
const REMOVE_ERRORS: Record<string, string> = {
  member_has_balance: "Can't remove — this person still has an unsettled balance.",
  not_authorized: 'Only the group owner can remove members.',
  invalid_request: "You can't remove yourself from the group.",
  member_already_removed: 'This person is no longer in the group.',
  member_not_in_group: 'This person is no longer in the group.',
  group_not_found: 'This group no longer exists.',
};

@Component({
  selector: 'app-member-actions-sheet',
  templateUrl: './member-actions-sheet.component.html',
  styleUrls: ['./member-actions-sheet.component.scss'],
  standalone: true,
  imports: [
    DecimalPipe,
    AvatarComponent,
    ChipComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class MemberActionsSheetComponent {
  @Input({ required: true }) groupId!: string;
  @Input({ required: true }) member!: GroupMember;
  /**
   * Null only when the balances call itself failed — a member with no expenses
   * still comes back from the API with a net of 0, so the row always renders and
   * falls back to a dash rather than vanishing.
   */
  @Input() netBalance: number | null = null;
  @Input() canRemove = false;

  private modalController = inject(ModalController);
  private alertController = inject(AlertController);
  private groupService = inject(GroupService);
  private toastService = inject(ToastService);

  removing = signal(false);

  isOwner = computed(() => isGroupOwner(this.member));
  isVirtual = computed(() => isVirtualMember(this.member));

  constructor() {
    addIcons({ closeOutline, trashOutline });
  }

  dismiss(): void {
    this.modalController.dismiss(null, 'cancel');
  }

  linkToAccount(): void {
    void this.toastService.infoToast('Linking accounts is coming soon');
  }

  /**
   * AlertController rather than an inline <ion-alert>: inside a sheet the inline
   * variant misbehaves — see pending-expenses-sheet.component.ts for the detail.
   */
  confirmRemove(): void {
    if (this.removing()) return;

    from(
      this.alertController.create({
        header: 'Remove from group?',
        message: `${this.member.displayName} will no longer be part of this group.`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Remove', role: 'destructive', handler: () => this.remove() },
        ],
      }),
    )
      .pipe(switchMap((alert) => from(alert.present())))
      .subscribe();
  }

  private remove(): void {
    this.removing.set(true);

    this.groupService.removeGroupMember(this.groupId, this.member.memberId).subscribe({
      next: () => {
        this.removing.set(false);
        void this.toastService.successToast(`${this.member.displayName} removed from group`);
        this.modalController.dismiss({ removed: true }, 'confirm');
      },
      error: (err: HttpErrorResponse) => {
        this.removing.set(false);
        const code = err.error?.code as string | undefined;
        void this.toastService.errorToast(
          (code && REMOVE_ERRORS[code]) || 'Something went wrong. Please try again.',
        );
      },
    });
  }
}
