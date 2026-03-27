import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonAlert,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
} from '@ionic/angular/standalone';
import { ToastService } from 'src/app/core/services/toast.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { PaginatorComponent } from 'src/app/shared/components/paginator/paginator.component';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  imports: [
    NgClass,
    DatePipe,
    DecimalPipe,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonAlert,
    AvatarComponent,
    PaginatorComponent,
  ],
})
export class ExpenseListComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  service = inject(ExpenseService);
  toastService = inject(ToastService);

  pendingDeleteId = '';
  isDeleteAlertOpen = false;

  alertButtons = [
    { text: 'Cancel', role: 'cancel' },
    {
      text: 'Delete',
      role: 'confirm',
      cssClass: 'delete-confirmation',
      handler: () => this.confirmDelete(),
    },
  ];

  ngOnInit() {
    this.service.getAll(this.route.snapshot.params['id']);
  }

  navigateToDetail(expenseId: string): void {
    const groupId = this.route.snapshot.params['id'];
    this.router.navigate(['groups', groupId, 'expenses', expenseId, 'details']);
  }

  navigateToEdit(expenseId: string): void {
    const groupId = this.route.snapshot.params['id'];
    this.router.navigate(['groups', groupId, 'expenses', expenseId]);
  }

  openDeleteAlert(expenseId: string): void {
    this.pendingDeleteId = expenseId;
    this.isDeleteAlertOpen = true;
  }

  private confirmDelete(): void {
    const groupId = this.route.snapshot.params['id'];
    this.service.deleteExpense(groupId, this.pendingDeleteId).subscribe({
      next: () => {
        this.toastService.successToast('Expense deleted');
        this.service.getAll(groupId);
      },
      error: () => this.toastService.errorToast('Failed to delete expense'),
    });
  }
}
