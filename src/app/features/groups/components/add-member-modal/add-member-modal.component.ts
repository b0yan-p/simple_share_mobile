import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { ConnectionService } from 'src/app/features/connections/services/connection.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { AddGroupMemberItem } from '../../models/add-group-members.model';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-add-member-modal',
  templateUrl: './add-member-modal.component.html',
  styleUrls: ['./add-member-modal.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AvatarComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonIcon,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class AddMemberModalComponent implements OnInit {
  @Input({ required: true }) groupId!: string;
  @Input() existingMemberIds: string[] = [];

  private modalController = inject(ModalController);
  private groupService = inject(GroupService);
  private connectionService = inject(ConnectionService);
  private toastService = inject(ToastService);

  activeTab = signal<'friends' | 'new'>('friends');
  submitting = signal(false);
  error = signal(false);

  connectionsLoading = this.connectionService.loading;

  availableConnections = computed(() => {
    const taken = new Set(this.existingMemberIds);
    return this.connectionService.items().filter((c) => !taken.has(c.id));
  });

  displayName = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  ngOnInit(): void {
    this.connectionService.getAll();
  }

  setTab(value: string): void {
    this.activeTab.set(value === 'new' ? 'new' : 'friends');
  }

  dismiss(): void {
    this.modalController.dismiss(null, 'cancel');
  }

  addExisting(memberId: string): void {
    this.submitMembers([{ memberId, inviteUser: false }]);
  }

  submitNew(): void {
    const name = this.displayName.value.trim();
    if (!name) {
      this.displayName.markAsTouched();
      return;
    }
    this.submitMembers([{ displayName: name, inviteUser: false }]);
  }

  private submitMembers(members: AddGroupMemberItem[]): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(false);

    this.groupService.addGroupMembers(this.groupId, { members }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.errorMessages?.length) {
          this.error.set(true);
          return;
        }
        this.toastService.successToast(
          members.length > 1 ? 'Members added to group' : 'Member added to group',
        );
        this.modalController.dismiss({ success: true }, 'confirm');
      },
      error: () => {
        this.submitting.set(false);
        this.error.set(true);
      },
    });
  }
}
