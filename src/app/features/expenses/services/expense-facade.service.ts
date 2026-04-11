import { inject, Injectable } from '@angular/core';
import {
  catchError,
  filter,
  from,
  merge,
  Observable,
  of,
  skip,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { CreateExpenseRequest, UpdateExpenseRequest } from '../models/create-expense.model';
import { ExpenseListItem } from '../models/expense-list-item.model';
import { ExpenseDetail } from '../models/expense.model';
import { mapExpenses } from '../utils/expense-list.utils';
import { ExpenseApiService } from './expense-api.service';
import { ExpenseIdbService } from './expense-idb.service';
import { ExpensePaginatorService } from './expense-paginator.service';
import { ExpenseStore } from './expense-store';

@Injectable({
  providedIn: 'root',
})
export class ExpenseFacade {
  private readonly expenseApi = inject(ExpenseApiService);
  private readonly paginator = inject(ExpensePaginatorService);
  readonly store = inject(ExpenseStore);
  private readonly toastService = inject(ToastService);
  private readonly ui = inject(UiService);
  private readonly networkService = inject(NetworkService);
  private readonly idb = inject(ExpenseIdbService);

  $loadExpenses?: Subscription;

  // #region load methods
  loadExpenses(groupId: string): void {
    this.$loadExpenses?.unsubscribe();
    this.store.clear();
    this.paginator.resetPagination();
    this.paginator.totalCount.set(0);

    const firstPage = { skip: 0, take: this.paginator.pageSize() };

    // Use of(firstPage) to trigger the initial load synchronously — avoids the
    // ReplaySubject replay race where pageRequest$ would emit the stale skip value
    // before resetPagination()'s effect fires, causing a double request.
    // pageRequest$ is used only for "load more" (skip > 0).
    const ref$ = merge(
      of(firstPage),
      this.paginator.pageRequest$.pipe(
        skip(1),
        filter((page) => page.skip > 0),
      ),
    ).pipe(
      switchMap((page) => {
        this.paginator.pageLoading.set(page.skip > 0);
        this.ui.listLoading.set(true);

        if (page.skip === 0) {
          return this.loadFirstPage(groupId, page);
        }

        return this.loadNextPage(groupId, page);
      }),
    );

    this.$loadExpenses = ref$.subscribe({
      error: (err) => console.log('error in facade: ', err),
    });
  }

  private loadFirstPage(groupId: string, page: { skip: number; take: number }) {
    return from(this.idb.getExpenses(groupId)).pipe(
      switchMap((cached) => {
        if (cached) {
          console.log(
            `[IDB HIT] group=${groupId}, items=${cached.items.length}, totalCount=${cached.totalCount}`,
          );
          this.paginator.totalCount.set(cached.totalCount);
          this.store.setExpenses(mapExpenses(cached.items));
        }

        if (!this.networkService.isOnline()) {
          this.ui.listLoading.set(false);
          this.paginator.pageLoading.set(false);
          if (!cached) {
            this.toastService.errorToast('No cached data available');
          }
          return of([] as ExpenseListItem[]);
        }

        return this.expenseApi.getExpenses(groupId, page).pipe(
          switchMap((res) => {
            const items = res?.data ?? [];
            this.paginator.totalCount.set(res.totalCount);
            console.log(
              `[API] group=${groupId}, items=${items.length}, totalCount=${res.totalCount}, skip=${page.skip}`,
            );

            if (!items.length) {
              this.ui.listLoading.set(false);
              this.paginator.pageLoading.set(false);
              if (!cached) {
                this.store.setExpenses([]);
                this.paginator.totalCount.set(0);
              } else if (res.totalCount > 0) {
                this.toastService.warnToast('Could not refresh expenses. Showing cached data.');
              }
              return of([] as ExpenseListItem[]);
            }

            return from(this.idb.saveExpenses(groupId, res.totalCount, items)).pipe(
              tap(() => {
                this.ui.listLoading.set(false);
                this.paginator.pageLoading.set(false);
                this.store.setExpenses(mapExpenses(items));
              }),
              switchMap(() => of([] as ExpenseListItem[])),
            );
          }),
          catchError((err) => this.handleError(err, groupId)),
        );
      }),
    );
  }

  private loadNextPage(groupId: string, page: { skip: number; take: number }) {
    if (!this.networkService.isOnline()) {
      this.ui.listLoading.set(false);
      this.paginator.pageLoading.set(false);
      this.toastService.errorToast('Cannot load more while offline');
      return of([] as ExpenseListItem[]);
    }

    return this.expenseApi.getExpenses(groupId, page).pipe(
      switchMap((res) => {
        const newItems = res?.data ?? [];
        this.paginator.totalCount.set(res.totalCount);
        console.log(
          `[API] group=${groupId}, items=${newItems.length}, totalCount=${res.totalCount}, skip=${page.skip}`,
        );

        if (!newItems.length) {
          this.ui.listLoading.set(false);
          this.paginator.pageLoading.set(false);
          return of([] as ExpenseListItem[]);
        }

        // Read existing cached items, append new ones, re-map the full list
        return from(this.idb.getExpenses(groupId)).pipe(
          switchMap((existing) => {
            const allItems = [...(existing?.items ?? []), ...newItems];
            return from(this.idb.saveExpenses(groupId, res.totalCount, allItems)).pipe(
              tap(() => {
                this.ui.listLoading.set(false);
                this.paginator.pageLoading.set(false);
                // Re-map entire list so cross-page month boundaries merge correctly
                this.store.setExpenses(mapExpenses(allItems));
              }),
              switchMap(() => of([] as ExpenseListItem[])),
            );
          }),
        );
      }),
      catchError((err) => this.handleError(err, groupId)),
    );
  }

  private handleError(err: any, groupId?: string) {
    console.warn(`[API ERROR] group=${groupId}`, err);
    this.store.setError(err.message);
    this.ui.listLoading.set(false);
    this.paginator.pageLoading.set(false);
    this.paginator.totalCount.set(0);
    this.toastService.errorToast(err.message);
    return of([] as ExpenseListItem[]);
  }

  loadExpense(groupId: string, expenseId: string): Observable<ExpenseDetail> {
    return this.expenseApi.getExpense(groupId, expenseId);
  }
  // #endregion

  // #region Mutation methods
  createExpense(groupId: string, payload: CreateExpenseRequest): Observable<{ id: string }> {
    return this.expenseApi
      .createExpense(groupId, payload)
      .pipe(tap(() => this.idb.deleteExpenses(groupId)));
  }

  updateExpense(groupId: string, payload: UpdateExpenseRequest): Observable<void> {
    return this.expenseApi
      .updateExpense(groupId, payload)
      .pipe(tap(() => this.idb.deleteExpenses(groupId)));
  }

  deleteExpense(groupId: string, expenseId: string): Observable<void> {
    return this.expenseApi
      .deleteExpense(groupId, expenseId)
      .pipe(tap(() => this.idb.deleteExpenses(groupId)));
  }
  // #endregion

  // #region sync/refresh methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refreshExpenses(_groupId: string): Observable<ExpenseListItem[]> {
    return of();
  }

  syncPendingExpenses() {}
  // #endregion

  // #region util methods
  clearExpensesState() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectExpense(_expenseId: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeExpenseFromState(_expenseId: string) {}
  // #endregion
}
