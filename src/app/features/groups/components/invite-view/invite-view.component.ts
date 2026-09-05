import { Component, inject, Input, OnInit, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  copyOutline,
  shareSocialOutline,
} from 'ionicons/icons';
import { first, from } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';

/**
 * Rendered in place of the "Add people" body rather than as its own sheet —
 * stacking a second bottom sheet on top of the first reads badly on mobile.
 */
@Component({
  selector: 'app-invite-view',
  templateUrl: './invite-view.component.html',
  styleUrls: ['./invite-view.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon],
})
export class InviteViewComponent implements OnInit {
  @Input({ required: true }) groupId!: string;
  @Input() mode: 'link' | 'qr' = 'link';

  back = output<void>();

  private toastService = inject(ToastService);

  inviteLink = '';

  constructor() {
    addIcons({ alertCircleOutline, arrowBackOutline, copyOutline, shareSocialOutline });
  }

  ngOnInit(): void {
    // TODO: replace with a real invite token from the backend — there is no
    // invite endpoint yet, so this is a placeholder shape, not a working link.
    this.inviteLink = `https://simpleshare.app/join/${this.groupId}`;
  }

  copyLink(): void {
    from(navigator.clipboard.writeText(this.inviteLink))
      .pipe(first())
      .subscribe({
        next: () => this.toastService.successToast('Link copied'),
        error: () => this.toastService.errorToast("Couldn't copy the link"),
      });
  }

  shareLink(): void {
    // The Web Share API is unavailable in the Android WebView and
    // @capacitor/share is not installed, so this waits on that plugin.
    this.toastService.infoToast('Coming soon');
  }
}
