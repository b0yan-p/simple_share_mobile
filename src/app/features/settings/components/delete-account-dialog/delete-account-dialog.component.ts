import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IonButton, IonIcon, IonModal, IonSpinner } from '@ionic/angular/standalone';
import { trashOutline, warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-delete-account-dialog',
  templateUrl: './delete-account-dialog.component.html',
  styleUrl: './delete-account-dialog.component.scss',
  imports: [IonButton, IonIcon, IonModal, IonSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAccountDialogComponent {
  readonly deleting = input.required<boolean>();
  readonly confirmed = output<void>();

  protected readonly confirmationOpen = signal(false);
  protected readonly canDismissProgress = () => !this.deleting();
  protected readonly trashIcon = trashOutline;
  protected readonly warningIcon = warningOutline;

  open(): void {
    if (!this.deleting()) this.confirmationOpen.set(true);
  }

  protected onConfirmationDismiss(role?: string): void {
    this.confirmationOpen.set(false);
    if (role === 'confirm') this.confirmed.emit();
  }
}
