import { inject, Injectable } from '@angular/core';
import {
  catchError,
  concatMap,
  filter,
  forkJoin,
  from,
  map,
  merge,
  Observable,
  of,
  skip,
  Subscription,
  switchMap,
  tap,
  toArray,
} from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { CreateExpenseRequest, UpdateExpenseRequest } from '../models/create-expense.model';
import { ExpenseListItem } from '../models/expense-list-item.model';
import { ExpenseDetail } from '../models/expense.model';
import { mapExpenses } from '../utils/expense-list.utils';
import { ExpenseApiService } from './expense-api.service';
import { ExpenseIdbService, PendingExpense } from './expense-idb.service';
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
  /**
   * Loads the first page for a group, or does nothing when the store already
   * holds fresh data for it. The early return is what keeps the list intact
   * across tab switches and detail navigation: $loadExpenses lives on this root
   * facade rather than on the component, so leaving it subscribed leaves the
   * pageRequest$ pipeline — and therefore the infinite scroll offset — exactly
   * where the user left it.
   */
  loadExpenses(groupId: string, opts: { force?: boolean } = {}): void {
    if (!opts.force && this.$loadExpenses && this.store.isFreshFor(groupId)) return;

    this.$loadExpenses?.unsubscribe();
    this.store.reset(groupId);
    this.store.setLoading();
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
    return this.idb.getExpenses(groupId).pipe(
      switchMap((cached) => {
        if (cached) {
          console.log(
            `[IDB HIT] group=${groupId}, items=${cached.items.length}, totalCount=${cached.totalCount}`,
          );
          this.paginator.totalCount.set(cached.totalCount);
          this.store.setItems(mapExpenses(cached.items));
          this.store.setReady();
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
                this.store.setItems([]);
                this.store.setReady();
                this.paginator.totalCount.set(0);
              } else if (res.totalCount > 0) {
                this.toastService.warnToast('Could not refresh expenses. Showing cached data.');
              }
              return of([] as ExpenseListItem[]);
            }

            return this.idb.saveExpenses(groupId, res.totalCount, items).pipe(
              tap(() => {
                this.ui.listLoading.set(false);
                this.paginator.pageLoading.set(false);
                this.store.setItems(mapExpenses(items));
                this.store.setReady();
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
        return this.idb.getExpenses(groupId).pipe(
          switchMap((existing) => {
            const allItems = [...(existing?.items ?? []), ...newItems];
            return this.idb.saveExpenses(groupId, res.totalCount, allItems).pipe(
              tap(() => {
                this.ui.listLoading.set(false);
                this.paginator.pageLoading.set(false);
                // Re-map entire list so cross-page month boundaries merge correctly
                this.store.setItems(mapExpenses(allItems));
                this.store.setReady();
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
  createExpense(
    groupId: string,
    payload: CreateExpenseRequest,
  ): Observable<{ id: string; queued: boolean }> {
    if (!this.networkService.isOnline()) {
      const tempId = crypto.randomUUID();
      return this.idb
        .savePendingExpense({ tempId, groupId, payload, createdAt: new Date().toISOString() })
        .pipe(map(() => ({ id: tempId, queued: true })));
    }

    return this.expenseApi.createExpense(groupId, payload).pipe(
      concatMap((res) => this.refreshExpenses(groupId).pipe(map(() => res))),
      map((res) => ({ ...res, queued: false })),
    );
  }

  updateExpense(groupId: string, payload: UpdateExpenseRequest): Observable<void> {
    return this.expenseApi
      .updateExpense(groupId, payload)
      .pipe(concatMap(() => this.refreshExpenses(groupId)));
  }

  deleteExpense(groupId: string, expenseId: string): Observable<void> {
    return this.expenseApi
      .deleteExpense(groupId, expenseId)
      .pipe(concatMap(() => this.refreshExpenses(groupId)));
  }
  // #endregion

  // #region pending expense operations
  getPendingExpenses(): Observable<PendingExpense[]> {
    return this.idb.getPendingExpenses();
  }

  getPendingExpense(tempId: string): Observable<PendingExpense | undefined> {
    return this.idb.getPendingExpense(tempId);
  }

  updatePendingExpense(
    tempId: string,
    groupId: string,
    payload: CreateExpenseRequest,
  ): Observable<void> {
    return this.idb.savePendingExpense({
      tempId,
      groupId,
      payload,
      createdAt: new Date().toISOString(),
    });
  }

  removePendingExpense(tempId: string): Observable<void> {
    return this.idb.deletePendingExpense(tempId);
  }
  // #endregion

  // #region sync/refresh methods
  /**
   * Drops the cached pages and reloads the first one. Call this after every
   * mutation, including the ones made through the legacy ExpenseService: Ionic
   * keeps the group screen alive while an expense page is pushed on top of it,
   * so ExpenseListComponent.ngOnInit does not reliably run again on the way
   * back and cannot be relied on to notice that the data went stale.
   */
  refreshExpenses(groupId: string): Observable<void> {
    return this.invalidateExpenses(groupId).pipe(
      tap(() => this.loadExpenses(groupId, { force: true })),
    );
  }

  syncPendingExpenses(): Observable<void> {
    return this.idb.getPendingExpenses().pipe(
      switchMap((pending) => {
        if (!pending.length) return of(void 0);

        return from(pending).pipe(
          concatMap((item) =>
            this.expenseApi.createExpense(item.groupId, item.payload).pipe(
              switchMap(() =>
                forkJoin([
                  this.idb.deletePendingExpense(item.tempId),
                  this.invalidateExpenses(item.groupId),
                ]),
              ),
              map(() => true),
              catchError((err) => {
                console.error('[SYNC] Failed to sync pending expense', item.tempId, err);
                return of(false);
              }),
            ),
          ),
          toArray(),
          tap((results) => {
            const synced = results.filter(Boolean).length;
            const failed = results.length - synced;
            if (synced > 0) {
              this.toastService.successToast(
                `${synced} pending expense${synced > 1 ? 's' : ''} synced successfully`,
              );
            }
            if (failed > 0) {
              this.toastService.errorToast(
                `Failed to sync ${failed} expense${failed > 1 ? 's' : ''}. Will retry when online.`,
              );
            }
          }),
          map(() => void 0),
        );
      }),
    );
  }
  // #endregion

  // #region util methods
  /**
   * Call after any mutation, including ones made through the legacy
   * ExpenseService: drops the cached page data and marks the store stale so the
   * next visit to the list refetches instead of serving what it already holds.
   */
  invalidateExpenses(groupId: string): Observable<void> {
    this.store.invalidate();
    return this.idb.deleteExpenses(groupId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectExpense(_expenseId: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeExpenseFromState(_expenseId: string) {}
  // #endregion
}
