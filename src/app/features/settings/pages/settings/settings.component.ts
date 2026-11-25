import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleOutline,
  chevronForwardOutline,
  documentTextOutline,
  informationCircleOutline,
  keyOutline,
  logOutOutline,
  mailOutline,
  personOutline,
  planetOutline,
  shieldOutline,
  trashOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { DeletedAccountCleanup } from 'src/app/auth/services/deleted-account-cleanup.service';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { NetworkService } from 'src/app/core/services/network.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { environment } from 'src/environments/environment';

import { ChangePasswordDialogComponent } from '../../components/change-password-dialog/change-password-dialog.component';
import { EditProfileDialogComponent } from '../../components/edit-profile-dialog/edit-profile-dialog.component';
import { DeleteAccountDialogComponent } from '../../components/delete-account-dialog/delete-account-dialog.component';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [
    AvatarComponent,
    ChangePasswordDialogComponent,
    EditProfileDialogComponent,
    DeleteAccountDialogComponent,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonList,
    IonTitle,
    IonToolbar,
  ],
})
export class SettingsComponent {
  protected readonly appVersion = environment.appVersion;
  private readonly auth = inject(AuthService);
  protected readonly user = inject(TokenStorageService).user;
  private readonly profiles = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cleanup = inject(DeletedAccountCleanup);
  private readonly toast = inject(ToastService);
  private readonly network = inject(NetworkService);

  protected readonly fullName = computed(() =>
    [this.user()?.firstName, this.user()?.lastName].filter(Boolean).join(' '),
  );
  protected readonly deleting = signal(false);

  protected readonly sections = computed(() => [
    {
      title: 'Account',
      rows: [
        ...(this.user()?.hasPassword
          ? [{ label: 'Change password', icon: 'key-outline' }]
          : []),
        { label: 'Delete Account', icon: 'trash-outline', danger: true },
      ],
    },
    {
      title: 'Support & Legal',
      rows: [
        { label: 'Help & Feedback', icon: 'chatbubble-outline' },
        { label: 'Privacy Policy', icon: 'shield-outline' },
        { label: 'Terms of Service', icon: 'document-text-outline' },
        { label: 'About ShareOrb', icon: 'information-circle-outline' },
      ],
    },
  ]);

  constructor() {
    addIcons({
      chatbubbleOutline,
      chevronForwardOutline,
      documentTextOutline,
      informationCircleOutline,
      keyOutline,
      logOutOutline,
      mailOutline,
      personOutline,
      planetOutline,
      shieldOutline,
      trashOutline,
    });
  }

  ionViewWillEnter(): void {
    if (this.user() && this.user()?.hasPassword === undefined) {
      this.profiles
        .load()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: () => void this.toast.errorToast('Could not load account settings.'),
        });
    }
  }

  canLeave(): boolean {
    return !this.deleting() || this.cleanup.leaving || !this.user();
  }

  @HostListener('document:ionBackButton', ['$event'])
  protectHardwareBack(event: Event): void {
    if (
      !this.canLeave() &&
      event instanceof CustomEvent &&
      typeof event.detail?.register === 'function'
    ) {
      event.detail.register(101, () => {});
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  protectDeletion(event: BeforeUnloadEvent): void {
    if (!this.canLeave()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  protected async deleteAccount(): Promise<void> {
    if (this.deleting()) return;
    if (!this.network.isOnline()) {
      void this.toast.errorToast('Connect to the internet to delete your account.');
      return;
    }

    this.deleting.set(true);
    try {
      await firstValueFrom(this.profiles.deleteAccount());
    } catch (error) {
      this.deleting.set(false);
      if (
        !this.cleanup.pending &&
        !(error instanceof HttpErrorResponse && error.status === 401)
      ) {
        void this.toast.errorToast(
          error instanceof HttpErrorResponse && error.status === 0
            ? 'Connection lost. Account deletion could not be confirmed. Please try again.'
            : 'Could not delete your account. Please try again.',
        );
      }
      return;
    }

    try {
      await this.cleanup.finish(true);
    } catch {
      // Bootstrap retries the durable cleanup before restoring a session.
      this.cleanup.leaving = true;
      window.location.reload();
    }
  }

  protected logout(): void {
    this.auth.logout();
  }
}
