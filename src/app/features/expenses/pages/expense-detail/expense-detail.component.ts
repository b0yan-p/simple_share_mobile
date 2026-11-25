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
import { concatMap } from 'rxjs';
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
    this.groups
      .loadGroupOverview(this.groupId)
      .subscribe((group) => this.currentMemberId.set(group?.currentMemberId ?? null));

    this.loadExpense(this.expenseId);
  }

  navigateToEdit(): void {
    this.router.navigate(['groups', this.groupId, 'expenses', this.expenseId]);
  }

  private confirmDelete(): void {
    this.expenseService
      .deleteExpense(this.groupId, this.expenseId)
      .pipe(concatMap(() => this.expenseFacade.refreshExpenses(this.groupId)))
      .subscribe({
        next: () => {
          this.toastService.successToast('Expense deleted');
          this.router.navigate(['groups', this.groupId, 'details']);
        },
        error: () => this.toastService.errorToast('Failed to delete expense'),
      });
  }

  private loadExpense(expenseId: string): void {
    this.expenseService.getExpense(this.groupId, expenseId).subscribe({
      next: (data) => {
        this.expense.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.errorToast('Failed to load expense');
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }
}
