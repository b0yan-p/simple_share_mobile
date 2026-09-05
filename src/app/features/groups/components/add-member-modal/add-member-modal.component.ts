import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  checkmarkCircle,
  close,
  closeOutline,
  ellipseOutline,
  qrCodeOutline,
  shareSocialOutline,
} from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';
import { ConnectionItem } from 'src/app/features/connections/models/connection.model';
import { ConnectionService } from 'src/app/features/connections/services/connection.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { AddGroupMemberItem } from '../../models/add-group-members.model';
import { GroupService } from '../../services/group.service';
import { InviteViewComponent } from '../invite-view/invite-view.component';

/** One entry in the horizontally scrollable "N selected" strip. */
interface SelectedChip {
  key: string;
  label: string;
  colorKey: string;
  kind: 'connection' | 'virtual';
}

@Component({
  selector: 'app-add-member-modal',
  templateUrl: './add-member-modal.component.html',
  styleUrls: ['./add-member-modal.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AvatarComponent,
    InviteViewComponent,
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
    IonTitle,
  ],
})
export class AddMemberModalComponent implements OnInit {
  @Input({ required: true }) groupId!: string;
  @Input() existingMemberIds: string[] = [];

  private modalController = inject(ModalController);
  private groupService = inject(GroupService);
  private connectionService = inject(ConnectionService);
  private toastService = inject(ToastService);

  /**
   * Which screen the sheet is showing. The invite screens replace this body
   * rather than opening on top of it, so the picked people survive the trip.
   */
  view = signal<'people' | 'link' | 'qr'>('people');
  activeTab = signal<'connections' | 'virtual'>('connections');
  submitting = signal(false);
  error = signal(false);

  connectionsLoading = this.connectionService.loading;

  /**
   * Selection spans both tabs on purpose — the strip shows connections and
   * virtual members side by side, and both go out in one bulk request.
   */
  selectedConnectionIds = signal<string[]>([]);
  virtualNames = signal<string[]>([]);

  totalSelected = computed(
    () => this.selectedConnectionIds().length + this.virtualNames().length,
  );

  private existing = computed(() => new Set(this.existingMemberIds));

  /**
   * Every connection, including the ones already in the group: those render as
   * "Already in group" rather than being hidden, so the list stays a stable
   * picture of who you know.
   */
  connections = computed(() =>
    this.connectionService.items().map((c) => ({
      ...c,
      alreadyInGroup: this.existing().has(c.id),
      selected: this.selectedConnectionIds().includes(c.id),
    })),
  );

  selectedChips = computed<SelectedChip[]>(() => {
    const byId = new Map(this.connectionService.items().map((c) => [c.id, c]));

    const connections = this.selectedConnectionIds().map<SelectedChip>((id) => ({
      key: `c:${id}`,
      label: this.firstName(byId.get(id)?.displayName ?? ''),
      colorKey: id,
      kind: 'connection',
    }));

    const virtual = this.virtualNames().map<SelectedChip>((name) => ({
      key: `v:${name}`,
      label: this.firstName(name),
      colorKey: name,
      kind: 'virtual',
    }));

    return [...connections, ...virtual];
  });

  displayName = new FormControl<string>('', { nonNullable: true });

  private strip = viewChild<ElementRef<HTMLElement>>('strip');
  /** Drives the right-edge fade that hints the strip scrolls sideways. */
  scrolledToEnd = signal(true);

  constructor() {
    // Re-measure whenever the selection changes: a chip added or dropped can
    // start or stop the overflow, and the DOM only reflects it after render.
    effect(() => {
      this.selectedChips();
      requestAnimationFrame(() => this.updateStripFade());
    });

    addIcons({
      addOutline,
      alertCircleOutline,
      checkmarkCircle,
      close,
      closeOutline,
      ellipseOutline,
      qrCodeOutline,
      shareSocialOutline,
    });
  }

  ngOnInit(): void {
    this.connectionService.getAll();
  }

  updateStripFade(): void {
    const el = this.strip()?.nativeElement;
    if (!el) return;

    // 1px of slack: fractional widths otherwise leave the fade showing even
    // once the strip is scrolled all the way to the end.
    const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
    this.scrolledToEnd.set(remaining <= 1);
  }

  setTab(value: string): void {
    this.activeTab.set(value === 'virtual' ? 'virtual' : 'connections');
  }

  title = computed(() =>
    this.view() === 'link' ? 'Invite link' : this.view() === 'qr' ? 'QR code' : 'Add people',
  );

  dismiss(): void {
    this.modalController.dismiss(null, 'cancel');
  }

  openInvite(mode: 'link' | 'qr'): void {
    this.view.set(mode);
  }

  backToPeople(): void {
    this.view.set('people');
  }

  toggleConnection(connection: ConnectionItem & { alreadyInGroup: boolean }): void {
    if (connection.alreadyInGroup || this.submitting()) return;

    this.selectedConnectionIds.update((ids) =>
      ids.includes(connection.id)
        ? ids.filter((id) => id !== connection.id)
        : [...ids, connection.id],
    );
  }

  addVirtual(): void {
    const name = this.displayName.value.trim();
    if (!name) return;

    // Two identical display names in one request would produce two members you
    // can no longer tell apart in the split UI.
    const taken = this.virtualNames().some((n) => n.toLowerCase() === name.toLowerCase());
    if (taken) {
      void this.toastService.warnToast(`${name} is already on the list`);
      return;
    }

    this.virtualNames.update((names) => [...names, name]);
    this.displayName.setValue('');
  }

  /** Tapping a chip in the strip is the only way to drop someone again. */
  removeChip(chip: SelectedChip): void {
    if (chip.kind === 'virtual') {
      this.virtualNames.update((names) => names.filter((n) => n !== chip.colorKey));
      return;
    }
    this.selectedConnectionIds.update((ids) => ids.filter((id) => id !== chip.colorKey));
  }

  submit(): void {
    if (this.submitting() || this.totalSelected() === 0) return;

    const members: AddGroupMemberItem[] = [
      ...this.selectedConnectionIds().map((memberId) => ({ memberId, inviteUser: false })),
      ...this.virtualNames().map((displayName) => ({ displayName, inviteUser: false })),
    ];

    this.submitting.set(true);
    this.error.set(false);

    this.groupService.addGroupMembers(this.groupId, { members }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        const added = res.members?.length ?? 0;
        const errors = res.errorMessages ?? [];

        // The backend commits one transaction per item, so a partial success is
        // a normal outcome and must not be reported as a plain failure.
        if (added === 0) {
          this.error.set(true);
          return;
        }

        if (errors.length) {
          void this.toastService.warnToast(`${added} of ${members.length} added. ${errors[0]}`);
        } else {
          void this.toastService.successToast(
            added > 1 ? `${added} people added` : 'Person added',
          );
        }

        this.modalController.dismiss({ success: true, addedCount: added }, 'confirm');
      },
      error: () => {
        this.submitting.set(false);
        this.error.set(true);
      },
    });
  }

  private firstName(displayName: string): string {
    return displayName.split(' ')[0] || displayName;
  }
}
