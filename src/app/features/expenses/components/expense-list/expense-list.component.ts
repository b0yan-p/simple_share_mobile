import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonAlert,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { from, map, Observable, switchMap, tap } from 'rxjs';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { PaginateDirective } from 'src/app/shared/directives/paginate.directive';
import { ExpenseListItem, ExpenseListItemDetails } from '../../models/expense-list-item.model';
import { ExpenseFacade } from '../../services/expense-facade.service';
import { ExpensePaginatorService } from '../../services/expense-paginator.service';
import {
  ExpenseFilter,
  ExpensesFilterComponent,
} from '../expenses-filter/expenses-filter.component';
import { PendingExpensesSheetComponent } from '../pending-expenses-sheet/pending-expenses-sheet.component';

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
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    ExpensesFilterComponent,
    EmptyStateComponent,
    PaginateDirective,
  ],
})
export class ExpenseListComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  facade = inject(ExpenseFacade);
  toastService = inject(ToastService);
  paginator = inject(ExpensePaginatorService);
  ui = inject(UiService);
  private readonly modalController = inject(ModalController);
  private readonly tokenStorage = inject(TokenStorageService);

  pendingDeleteId = '';
  isDeleteAlertOpen = false;
  pendingCount = signal(0);

  /** Local UI-only filter state. Data-level filtering can be wired later. */
  readonly activeFilter = signal<ExpenseFilter>('all');

  /** Expense groups filtered by the currently active pill. */
  readonly filteredGroups = computed<ExpenseListItem[]>(() => {
    const groups = this.facade.store.expenses();
    const filter = this.activeFilter();

    if (filter === 'all') return groups;

    return groups
      .map((group) => ({
        ...group,
        expenses: group.expenses.filter((e) =>
          filter === 'settled' ? this.isSettled(e) : !this.isSettled(e),
        ),
      }))
      .filter((group) => group.expenses.length > 0);
  });

  readonly hasExpenses = computed(() => this.facade.store.expenses().length > 0);

  routeParams$?: Observable<string>;

  alertButtons = [
    { text: 'Cancel', role: 'cancel' },
    {
      text: 'Delete',
      role: 'confirm',
      cssClass: 'delete-confirmation',
      handler: () => this.confirmDelete(),
    },
  ];

  constructor() {
    this.routeParams$ = this.route.params.pipe(
      map((p) => p['id']),
      takeUntilDestroyed(),
    );
  }

  ngOnInit(): void {
    // Ensure the current user signal is populated so "Paid by you" can resolve.
    if (!this.tokenStorage.user()) {
      this.tokenStorage.getUser().subscribe();
    }

    this.routeParams$?.subscribe((groupId) => {
      this.facade.loadExpenses(groupId);
      this.loadPendingCount(groupId);
    });
  }

  /**
   * Renders the payer subtitle. If the sole payer's display name matches the
   * logged-in user, shows "you"; otherwise the member name or a count.
   */
  paidByLabel(expense: ExpenseListItemDetails): string {
    if (expense.paidByMembers.length > 1) {
      return `${expense.paidByMembers.length} people`;
    }

    const payer = expense.paidByMembers[0] ?? '';
    return this.isCurrentUser(payer) ? 'you' : payer;
  }

  private isCurrentUser(displayName: string): boolean {
    const me = this.tokenStorage.user();
    if (!me || !displayName) return false;

    const target = displayName.trim().toLowerCase();
    return [me.fullName, `${me.firstName} ${me.lastName}`]
      .filter(Boolean)
      .some((name) => name.trim().toLowerCase() === target);
  }

  /** An expense is settled when the current user has no open balance on it. */
  isSettled(expense: ExpenseListItemDetails): boolean {
    return expense.isSettleUp || expense.net === 0;
  }

  /** Pastel icon-tile tone derived from the user's personal status. */
  toneOf(expense: ExpenseListItemDetails): 'success' | 'error' | 'primary' {
    if (this.isSettled(expense)) return 'primary';
    return expense.net > 0 ? 'success' : 'error';
  }

  iconOf(expense: ExpenseListItemDetails): string {
    return expense.isSettleUp ? 'swap-horizontal-outline' : 'receipt-outline';
  }

  private loadPendingCount(groupId: string): void {
    this.facade
      .getPendingExpenses()
      .pipe(map((p) => p.filter((e) => e.groupId === groupId).length))
      .subscribe((count) => this.pendingCount.set(count));
  }

  openPendingSheet(): void {
    const groupId = this.route.snapshot.params['id'];
    from(
      this.modalController.create({
        component: PendingExpensesSheetComponent,
        componentProps: { groupId },
        breakpoints: [0, 0.85],
        initialBreakpoint: 0.85,
      }),
    )
      .pipe(
        switchMap((modal) => from(modal.present()).pipe(map(() => modal))),
        switchMap((modal) => from(modal.onWillDismiss())),
        tap(() => this.loadPendingCount(groupId)),
      )
      .subscribe();
  }

  navigateToDetail(expenseId: string): void {
    const groupId = this.route.snapshot.params['id'];
    this.router.navigate(['groups', groupId, 'expenses', expenseId, 'details']);
  }

  navigateToEdit(expenseId: string): void {
    const groupId = this.route.snapshot.params['id'];
    this.router.navigate(['groups', groupId, 'expenses', expenseId]);
  }

  navigateToNew(): void {
    const groupId = this.route.snapshot.params['id'];
    this.router.navigate(['groups', groupId, 'expenses', 'new']);
  }

  openDeleteAlert(expenseId: string): void {
    this.pendingDeleteId = expenseId;
    this.isDeleteAlertOpen = true;
  }

  private confirmDelete(): void {
    const groupId = this.route.snapshot.params['id'];
    this.facade.deleteExpense(groupId, this.pendingDeleteId).subscribe({
      next: () => {
        this.toastService.successToast('Expense deleted');
        // TODO instead of reloading the whole list we should just remove the deleted expense from the state and from database
        this.facade.loadExpenses(groupId);
      },
      error: () => this.toastService.errorToast('Failed to delete expense'),
    });
  }
}
