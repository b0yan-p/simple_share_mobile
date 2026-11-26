import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from 'src/app/core/services/api-error';
import { ToastService } from 'src/app/core/services/toast.service';
import { GroupFacade } from 'src/app/features/groups/services/group-facade.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { ExpenseDetail } from '../../models/expense.model';
import { ExpenseFacade } from '../../services/expense-facade.service';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-expense-detail',
  templateUrl: './expense-detail.component.html',
  styleUrls: ['./expense-detail.component.scss'],
  imports: [
    DatePipe,
    DecimalPipe,
    AvatarComponent,
    EmptyStateComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
    IonSpinner,
    IonAlert,
  ],
})
export class ExpenseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private expenseService = inject(ExpenseService);
  private expenseFacade = inject(ExpenseFacade);
  private toastService = inject(ToastService);
  private groups = inject(GroupFacade);

  readonly currentMemberId = signal<string | null>(null);

  get currency(): string {
    return this.expense()?.groupCurrency ?? '';
  }
  expense = signal<ExpenseDetail | null>(null);
  loading = signal(true);
  notFound = signal(false);
  loadError = signal<string | null>(null);

  /** The logged-in user's net on this expense: what they paid minus their share. */
  readonly myNet = computed(() => {
    const exp = this.expense();
    if (!exp) return 0;

    const sum = (rows: { memberId: string; amount: number }[]) =>
      rows
        .filter((r) => r.memberId === this.currentMemberId())
        .reduce((acc, r) => acc + r.amount, 0);

    return Math.round((sum(exp.paidBy) - sum(exp.splittedBy)) * 100) / 100;
  });
  groupId = '';
  expenseId = '';
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

  ngOnInit(): void {
    this.groupId = this.route.snapshot.params['id'];
    this.expenseId = this.route.snapshot.params['expenseId'];
    this.groups.loadGroupOverview(this.groupId).subscribe({
      next: (group) => this.currentMemberId.set(group?.currentMemberId ?? null),
      error: () => this.currentMemberId.set(null),
    });

    this.loadExpense(this.expenseId);
  }

  navigateToEdit(): void {
    this.router.navigate(['groups', this.groupId, 'expenses', this.expenseId]);
  }

  private confirmDelete(): void {
    this.expenseFacade.deleteExpense(this.groupId, this.expenseId).subscribe({
      next: (refreshed) => {
        this.toastService.successToast(
          refreshed ? 'Expense deleted' : 'Expense deleted. Display may be out of date.',
        );
        this.router.navigate(['groups', this.groupId, 'details']);
      },
      error: (err) =>
        this.toastService.errorToast(apiErrorMessage(err, 'Failed to delete expense')),
    });
  }

  protected loadExpense(expenseId: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.loadError.set(null);
    this.expenseService.getExpense(this.groupId, expenseId).subscribe({
      next: (data) => {
        this.expense.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err instanceof HttpErrorResponse && err.status === 404) this.notFound.set(true);
        else this.loadError.set(apiErrorMessage(err, 'Could not load expense.'));
      },
    });
  }
}
