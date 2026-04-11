import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { ExpenseFacade } from '../../services/expense-facade.service';
import { PendingExpense } from '../../services/expense-idb.service';

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
  ],
})
export class PendingExpensesSheetComponent implements OnInit {
  @Input({ required: true }) groupId!: string;

  private readonly modalController = inject(ModalController);
  private readonly expenseFacade = inject(ExpenseFacade);
  private readonly router = inject(Router);

  pendingExpenses: PendingExpense[] = [];

  ngOnInit(): void {
    this.loadPendingExpenses();
  }

  private loadPendingExpenses(): void {
    this.expenseFacade.getPendingExpenses().subscribe((all) => {
      this.pendingExpenses = all.filter((e) => e.groupId === this.groupId);
    });
  }

  async onEdit(item: PendingExpense): Promise<void> {
    await this.modalController.dismiss();
    this.router.navigate(['groups', this.groupId, 'expenses', 'pending', item.tempId]);
  }

  onDelete(item: PendingExpense): void {
    this.expenseFacade.removePendingExpense(item.tempId).subscribe(() => {
      this.pendingExpenses = this.pendingExpenses.filter((e) => e.tempId !== item.tempId);
      if (this.pendingExpenses.length === 0) {
        this.modalController.dismiss();
      }
    });
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}
