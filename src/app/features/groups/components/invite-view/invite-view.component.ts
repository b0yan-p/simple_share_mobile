import { Component, inject, Input, OnInit, output, signal } from '@angular/core';
import { Share } from '@capacitor/share';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { QRCodeComponent } from 'angularx-qrcode';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  copyOutline,
  shareSocialOutline,
} from 'ionicons/icons';
import { first, from } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { GroupService } from '../../services/group.service';
import { environment } from 'src/environments/environment';

/**
 * Rendered in place of the "Add people" body rather than as its own sheet —
 * stacking a second bottom sheet on top of the first reads badly on mobile.
 */
@Component({
  selector: 'app-invite-view',
  templateUrl: './invite-view.component.html',
  styleUrls: ['./invite-view.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, IonSpinner, QRCodeComponent],
})
export class InviteViewComponent implements OnInit {
  @Input({ required: true }) groupId!: string;
  @Input() mode: 'link' | 'qr' = 'link';

  back = output<void>();

  private toastService = inject(ToastService);
  private groupService = inject(GroupService);

  inviteLink = signal('');
  loading = signal(false);
  failed = signal(false);

  clientUrl = environment.clientUrl;

  /**
   * Read off the live theme tokens rather than repeating hex values, so the code
   * follows the palette. The fallbacks matter because a token resolving to an
   * empty string would leave the renderer with no colour at all.
   */
  readonly qrDark = this.themeColor('--ss-text-heading', '#1a1640');
  readonly qrLight = this.themeColor('--ss-surface', '#ffffff');

  constructor() {
    addIcons({ alertCircleOutline, arrowBackOutline, copyOutline, shareSocialOutline });
  }

  ngOnInit(): void {
    this.loadLink();
  }

  loadLink(): void {
    this.loading.set(true);
    this.failed.set(false);

    this.groupService.getGroupInvitation(this.groupId).subscribe({
      next: (invitation) => {
        // TODO: the host is still a placeholder — there is no deep-link domain
        // registered yet, so the path is real but the origin is not.
        this.inviteLink.set(`${this.clientUrl}/join/${invitation.token}`);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  copyLink(): void {
    from(navigator.clipboard.writeText(this.inviteLink()))
      .pipe(first())
      .subscribe({
        next: () => this.toastService.successToast('Link copied'),
        error: () => this.toastService.errorToast("Couldn't copy the link"),
      });
  }

  /**
   * async/await here rather than the RxJS wrapping used elsewhere: these are
   * sequential Capacitor calls, and the plugin API is promise-first by design.
   */
  async shareLink(): Promise<void> {
    const url = this.inviteLink();
    if (!url) return;

    // canShare is false on a desktop browser, where the Web Share API is
    // missing. Treat a failing probe the same way and fall back, so the button
    // stays useful there instead of throwing at whoever is testing.
    const canShare = await Share.canShare()
      .then(({ value }) => value)
      .catch(() => false);

    if (!canShare) {
      // Reuses the copy path, including its success and failure toasts.
      this.copyLink();
      return;
    }

    try {
      await Share.share({
        title: 'Join my group on SimpleShare',
        text: 'Join my group on SimpleShare so we can split expenses together.',
        url,
        dialogTitle: 'Share invite link',
      });
    } catch (error) {
      if (isShareCancelled(error)) return;

      this.toastService.errorToast("Couldn't open the share sheet");
    }
  }

  private themeColor(token: string, fallback: string): string {
    const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    return value || fallback;
  }
}

/**
 * A dismissed share sheet rejects rather than resolving, and the plugin marks
 * it only in the message — there is no error code to branch on. Cancelling is a
 * choice, so it stays silent; anything else is worth telling the user about.
 */
function isShareCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('cancel');
}
