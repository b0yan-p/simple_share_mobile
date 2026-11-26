import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { AdvanceInputDirective } from '../advance-input.directive';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { apiErrorMessage } from 'src/app/core/services/api-error';

@Component({
  selector: 'app-edit-profile-dialog',
  templateUrl: './edit-profile-dialog.component.html',
  styleUrl: '../settings-form-dialog.scss',
  imports: [
    AdvanceInputDirective,
    ReactiveFormsModule,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonModal,
    IonTitle,
    IonToolbar,
  ],
})
export class EditProfileDialogComponent {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly breakpoints = [0, 1];
  private readonly profiles = inject(ProfileService);
  private loadRequest?: Subscription;
  protected readonly state = signal<'loading' | 'loadError' | 'ready' | 'saving'>('loading');
  protected readonly error = signal('');
  protected readonly canDismiss = async () => this.state() !== 'saving';

  protected readonly editOpen = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: '',
    lastName: '',
    displayName: '',
  });

  constructor() {
    addIcons({ closeOutline });
  }

  open(): void {
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
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Could not load your profile.'));
          this.state.set('loadError');
        },
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
        error: (err) => {
          this.state.set('ready');
          this.error.set(
            apiErrorMessage(err, 'Could not save your profile. Please try again.'),
          );
        },
      });
  }
}
