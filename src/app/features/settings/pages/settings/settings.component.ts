import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleOutline,
  chevronForwardOutline,
  closeOutline,
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
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { environment } from 'src/environments/environment';

import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [
    AvatarComponent,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonList,
    IonModal,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class SettingsComponent {
  protected readonly appVersion = environment.appVersion;
  private readonly auth = inject(AuthService);
  protected readonly user = inject(TokenStorageService).user;
  private readonly profiles = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequest?: Subscription;
  protected readonly fullName = computed(() =>
    [this.user()?.firstName, this.user()?.lastName].filter(Boolean).join(' '),
  );
  protected readonly state = signal<'loading' | 'loadError' | 'ready' | 'saving'>('loading');
  protected readonly error = signal('');
  protected readonly canDismiss = async () => this.state() !== 'saving';

  protected readonly editOpen = signal(false);
  protected readonly breakpoints = [0, 1];
  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: '',
    lastName: '',
    displayName: '',
  });
  protected readonly sections = [
    {
      title: 'Account',
      rows: [
        { label: 'Reset Password', icon: 'key-outline' },
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
  ];

  constructor() {
    addIcons({
      chatbubbleOutline,
      chevronForwardOutline,
      closeOutline,
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

  protected editProfile(): void {
    this.editOpen.set(true);
    this.loadProfile();
  }

  protected loadProfile(): void {
    this.loadRequest?.unsubscribe();
    this.state.set('loading');
    this.error.set('');
    this.loadRequest = this.profiles
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.form.reset(profile);
          this.state.set('ready');
        },
        error: () => this.state.set('loadError'),
      });
  }

  protected dismissProfile(): void {
    this.loadRequest?.unsubscribe();
    this.editOpen.set(false);
  }

  protected saveProfile(): void {
    if (this.state() !== 'ready') return;
    const values = this.form.getRawValue();
    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();
    const displayName = values.displayName.trim();
    if (!firstName || displayName.length < 2 || displayName.length > 80) {
      this.error.set('Enter a first name and a display name between 2 and 80 characters.');
      return;
    }
    this.error.set('');
    this.state.set('saving');
    this.profiles
      .save({ firstName, lastName, displayName })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.state.set('ready');
          this.editOpen.set(false);
        },
        error: () => {
          this.state.set('ready');
          this.error.set('Could not save your profile. Please try again.');
        },
      });
  }

  protected logout(): void {
    this.auth.logout();
  }
}
