import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
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
import { ToastService } from 'src/app/core/services/toast.service';
import { ExpenseDetail } from '../../models/expense.model';
import { ExpenseService } from '../../services/expense.service';
import { CURRENCY } from '../../utils/expense.constants';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';

@Component({
  selector: 'app-expense-detail',
  templateUrl: './expense-detail.component.html',
  styleUrls: ['./expense-detail.component.scss'],
  imports: [
    DatePipe,
    DecimalPipe,
    AvatarComponent,
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
  private router = inject(Router);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);
  private tokenStorage = inject(TokenStorageService);

  readonly currency = CURRENCY;
  expense = signal<ExpenseDetail | null>(null);
  loading = signal(true);

  /** The logged-in user's net on this expense: what they paid minus their share. */
  readonly myNet = computed(() => {
    const exp = this.expense();
    if (!exp) return 0;

    const sum = (rows: { memberName: string; amount: number }[]) =>
      rows.filter((r) => this.isCurrentUser(r.memberName)).reduce((acc, r) => acc + r.amount, 0);

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
    if (!this.tokenStorage.user()) {
      this.tokenStorage.getUser().subscribe();
    }
    this.groupId = this.route.snapshot.params['id'];
    this.expenseId = this.route.snapshot.params['expenseId'];
    this.loadExpense(this.expenseId);
  }

  private isCurrentUser(displayName: string): boolean {
    const me = this.tokenStorage.user();
    if (!me || !displayName) return false;

    const target = displayName.trim().toLowerCase();
    return [me.fullName, `${me.firstName} ${me.lastName}`]
      .filter(Boolean)
      .some((name) => name.trim().toLowerCase() === target);
  }

  navigateToEdit(): void {
    this.router.navigate(['groups', this.groupId, 'expenses', this.expenseId]);
  }

  private confirmDelete(): void {
    this.expenseService.deleteExpense(this.groupId, this.expenseId).subscribe({
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
      },
    });
  }
}
