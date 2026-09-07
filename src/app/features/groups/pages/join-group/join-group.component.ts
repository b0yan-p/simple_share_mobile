import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircle } from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { InvitePreview } from '../../models/invite-preview.model';
import { GroupFacade } from '../../services/group-facade.service';
import { GroupService } from '../../services/group.service';

/**
 * Entry point for an invite link or QR scan. Lives outside the tab shell: the
 * user arrives here from outside the app, with nowhere to navigate back to.
 */
@Component({
  selector: 'app-join-group',
  templateUrl: './join-group.component.html',
  styleUrls: ['./join-group.component.scss'],
  standalone: true,
  imports: [
    AvatarComponent,
    EmptyStateComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class JoinGroupComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(GroupService);
  private groupFacade = inject(GroupFacade);
  private toastService = inject(ToastService);

  readonly token: string = this.route.snapshot.params['token'];

  /**
   * Only known once the preview lands: the link carries a token, and the group
   * id it belongs to is deliberately not derivable from it.
   */
  private groupId: string | null = null;

  preview = signal<InvitePreview | null>(null);
  loading = signal(true);
  failed = signal(false);
  joining = signal(false);
  joined = signal(false);
  /** The backend treats re-joining as success, so say so instead of celebrating. */
  alreadyMember = signal(false);

  constructor() {
    addIcons({ alertCircleOutline, checkmarkCircle });
  }

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    this.loading.set(true);
    this.failed.set(false);

    this.groupService.getInvitePreview(this.token).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.groupId = preview.groupId;
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  join(): void {
    if (this.joining()) return;
    this.joining.set(true);

    this.groupFacade.joinGroup(this.token).subscribe({
      next: (result) => {
        this.joining.set(false);
        this.groupId = result.groupId;
        this.alreadyMember.set(result.alreadyMember);
        this.joined.set(true);
      },
      error: (err) => {
        this.joining.set(false);
        this.toastService.errorToast(err.message);
      },
    });
  }

  openGroup(): void {
    if (this.groupId) this.router.navigate(['groups', this.groupId, 'details']);
  }

  goHome(): void {
    this.router.navigate(['home']);
  }
}
