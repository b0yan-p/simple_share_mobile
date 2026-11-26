import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { ExpenseFacade } from '../../services/expense-facade.service';
import { PendingExpense } from '../../services/expense-idb.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-pending-expenses-sheet',
  templateUrl: './pending-expenses-sheet.component.html',
  styleUrls: ['./pending-expenses-sheet.component.scss'],
  imports: [
    DatePipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    EmptyStateComponent,
    IonTitle,
  ],
})
export class PendingExpensesSheetComponent implements OnInit {
  @Input({ required: true }) groupId!: string;

  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly expenseFacade = inject(ExpenseFacade);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  pendingExpenses: PendingExpense[] = [];
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.loadPendingExpenses();
  }

  protected loadPendingExpenses(): void {
    this.loading.set(true);
    this.error.set(false);
    this.expenseFacade.getPendingExpenses().subscribe({
      next: (all) => {
        this.pendingExpenses = all.filter((e) => e.groupId === this.groupId);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  async onEdit(item: PendingExpense): Promise<void> {
    await this.modalController.dismiss();
    this.router.navigate(['groups', this.groupId, 'expenses', 'pending', item.tempId]);
  }

  /**
   * Presented through AlertController rather than an inline <ion-alert>. An inline
   * overlay stays where it sits in the DOM, and ion-alert's host is
   * `position: absolute; inset: 0; contain: strict; --max-height: 90%`. Inside this
   * sheet modal the nearest positioned ancestor is the modal wrapper, so the alert
   * is sized and clipped to the sheet instead of the viewport — which silently cut
   * the button row off the bottom. AlertController appends to ion-app instead.
   */
  async onDelete(item: PendingExpense): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Expense',
      message: "This expense hasn't synced yet. Are you sure you want to delete it?",
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'confirm', cssClass: 'delete-confirmation' },
      ],
    });

    await alert.present();
    const { role } = await alert.onWillDismiss();

    if (role !== 'confirm') return;

    this.expenseFacade.removePendingExpense(item.tempId).subscribe({
      next: () => {
        this.pendingExpenses = this.pendingExpenses.filter((e) => e.tempId !== item.tempId);
        if (this.pendingExpenses.length === 0) this.modalController.dismiss();
      },
      error: () => this.toast.errorToast('Could not delete pending expense. Please try again.'),
    });
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}
