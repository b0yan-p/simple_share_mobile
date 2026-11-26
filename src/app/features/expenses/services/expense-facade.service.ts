import { inject, Injectable } from '@angular/core';
import {
  catchError,
  concatMap,
  filter,
  defer,
  from,
  map,
  merge,
  Observable,
  of,
  skip,
  Subject,
  Subscription,
  switchMap,
  tap,
  toArray,
} from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { apiErrorMessage } from 'src/app/core/services/api-error';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { LoadStatus } from 'src/app/core/store/models/list-state.model';
import { runAndSettle } from 'src/app/shared/utils/settle.helper';
import { CreateExpenseRequest, UpdateExpenseRequest } from '../models/create-expense.model';
import { ExpenseListItem, ExpenseListItemDetails } from '../models/expense-list-item.model';
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

  /**
   * Emits once every time a page load settles — success, empty, cached-only or
   * error alike, since every branch of the pipeline ends in `of([])`. This is
   * the completion signal the pull-to-refresh spinner waits on.
   */
  private readonly expensesSettled = new Subject<void>();

  // #region load methods
  /**
   * Loads the first page for a group, or does nothing when the store already
   * holds fresh data for it. The early return is what keeps the list intact
   * across tab switches and detail navigation: $loadExpenses lives on this root
   * facade rather than on the component, so leaving it subscribed leaves the
   * pageRequest$ pipeline — and therefore the infinite scroll offset — exactly
   * where the user left it.
   */
  loadExpenses(
    groupId: string,
    opts: { force?: boolean; skipCache?: boolean; silentError?: boolean } = {},
  ): void {
    if (!opts.force && this.$loadExpenses && this.store.isFreshFor(groupId)) return;

    this.$loadExpenses?.unsubscribe();
    // A cache-skipping reload has nothing to repaint the list with, so it keeps
    // the current items until the fresh page lands.
    if (opts.skipCache) this.store.reload(groupId);
    else this.store.reset(groupId);
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
          return this.loadFirstPage(
            groupId,
            page,
            opts.skipCache ?? false,
            opts.silentError ?? false,
          );
        }

        return this.loadNextPage(groupId, page);
      }),
    );

    this.$loadExpenses = ref$.subscribe({
      next: () => this.expensesSettled.next(),
      error: (err) => console.log('error in facade: ', err),
    });
  }

  /**
   * `skipCache` is what makes a pull-to-refresh show only server data: the IDB
   * record is left in place (so a failed request keeps its fallback) but it is
   * not painted, and it gets overwritten once the fresh page lands.
   */
  private loadFirstPage(
    groupId: string,
    page: { skip: number; take: number },
    skipCache = false,
    silentError = false,
  ) {
    const cached$: Observable<{ items: ExpenseListItemDetails[]; totalCount: number } | null> =
      skipCache
        ? of(null)
        : this.idb.getExpenses(groupId).pipe(
            catchError((err) => {
              console.warn('Could not read cached expenses', err);
              return of(null);
            }),
          );

    return cached$.pipe(
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
            this.store.setError('No saved expenses on this device. Reconnect and try again.');
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
              if (res.totalCount > 0) {
                if (cached)
                  this.toastService.warnToast(
                    'Could not refresh expenses. Showing cached data.',
                  );
                else this.store.setError('Could not load expenses. Please try again.');
                return of([] as ExpenseListItem[]);
              }
              this.store.setItems([]);
              this.store.setReady();
              this.idb.saveExpenses(groupId, res.totalCount, []).subscribe({
                error: (err) => console.warn('Could not cache empty expense list', err),
              });
              return of([] as ExpenseListItem[]);
            }

            return this.idb.saveExpenses(groupId, res.totalCount, items).pipe(
              catchError((err) => {
                console.warn('Could not cache expenses', err);
                return of(void 0);
              }),
              tap(() => {
                this.ui.listLoading.set(false);
                this.paginator.pageLoading.set(false);
                this.store.setItems(mapExpenses(items));
                this.store.setReady();
              }),
              switchMap(() => of([] as ExpenseListItem[])),
            );
          }),
          catchError((err) => this.handleError(err, groupId, silentError)),
        );
      }),
      catchError((err) => this.handleError(err, groupId, silentError)),
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
          catchError((err) => {
            console.warn('Could not read cached expense page', err);
            return of(null);
          }),
          switchMap((existing) => {
            const previousItems =
              existing?.items ??
              this.store
                .items()
                .reduce<ExpenseListItemDetails[]>(
                  (all, month) => [...all, ...month.expenses],
                  [],
                );
            const allItems = [...previousItems, ...newItems];
            return this.idb.saveExpenses(groupId, res.totalCount, allItems).pipe(
              catchError((err) => {
                console.warn('Could not cache expense page', err);
                return of(void 0);
              }),
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

  private handleError(err: any, groupId?: string, silentError = false) {
    console.warn(`[API ERROR] group=${groupId}`, err);
    if (this.paginator.pageLoading()) this.paginator.pageError.set(true);
    this.ui.listLoading.set(false);
    this.paginator.pageLoading.set(false);
    const message = apiErrorMessage(err, 'Failed to load expenses');
    this.store.setError(message);
    if (this.store.items().length && !silentError) this.toastService.errorToast(message);
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
  ): Observable<{ id: string; queued: boolean; refreshed: boolean }> {
    if (!this.networkService.isOnline()) {
      const tempId = payload.clientExpenseId;
      return this.idb
        .savePendingExpense({ tempId, groupId, payload, createdAt: new Date().toISOString() })
        .pipe(map(() => ({ id: tempId, queued: true, refreshed: true })));
    }

    return this.expenseApi.createExpense(groupId, payload).pipe(
      concatMap((res) =>
        this.refreshAfterMutation(groupId).pipe(map((refreshed) => ({ ...res, refreshed }))),
      ),
      map((res) => ({ ...res, queued: false })),
    );
  }

  updateExpense(groupId: string, payload: UpdateExpenseRequest): Observable<boolean> {
    return this.expenseApi
      .updateExpense(groupId, payload)
      .pipe(concatMap(() => this.refreshAfterMutation(groupId)));
  }

  deleteExpense(groupId: string, expenseId: string): Observable<boolean> {
    return this.expenseApi
      .deleteExpense(groupId, expenseId)
      .pipe(concatMap(() => this.refreshAfterMutation(groupId)));
  }

  /** A successful mutation stays successful if its subsequent local refresh fails. */
  refreshAfterMutation(groupId: string): Observable<boolean> {
    return defer(() => this.refreshExpenses(groupId, true)).pipe(
      map(() => this.store.status() !== LoadStatus.Error),
      catchError((error) => {
        console.warn('[EXPENSE] Could not refresh after accepted mutation', error);
        return of(false);
      }),
    );
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
  refreshExpenses(groupId: string, silentError = false): Observable<void> {
    return this.invalidateExpenses(groupId).pipe(
      switchMap(() => this.reloadExpenses(groupId, silentError)),
    );
  }

  /**
   * Page one straight from the API, no cache paint, completing once the list has
   * settled. Shared by pull-to-refresh and by the post-mutation reload.
   */
  reloadExpenses(groupId: string, silentError = false): Observable<void> {
    return runAndSettle(this.expensesSettled, () =>
      this.loadExpenses(groupId, { force: true, skipCache: true, silentError }),
    );
  }

  syncPendingExpenses(): Observable<void> {
    return this.idb.getPendingExpenses().pipe(
      catchError((error) => {
        console.error('[SYNC] Could not read pending expenses', error);
        this.toastService.warnToast('Could not read pending expenses on this device.');
        return of([] as PendingExpense[]);
      }),
      switchMap((pending) => {
        if (!pending.length) return of(void 0);

        return from(pending).pipe(
          concatMap((item) =>
            this.expenseApi
              .createExpense(item.groupId, { ...item.payload, clientExpenseId: item.tempId })
              .pipe(
                map(() => true),
                catchError((err) =>
                  this.idb
                    .recordPendingError(
                      item.tempId,
                      err?.error?.detail ?? 'Failed to sync. Edit or retry.',
                    )
                    .pipe(
                      map(() => false),
                      catchError((storageError) => {
                        console.error('[SYNC] Could not record pending error', storageError);
                        this.toastService.warnToast(
                          'Could not save the sync error on this device.',
                        );
                        return of(false);
                      }),
                    ),
                ),
                concatMap((accepted) =>
                  accepted
                    ? this.afterAcceptance(() =>
                        this.idb.deletePendingExpense(item.tempId),
                      ).pipe(
                        concatMap(() =>
                          this.afterAcceptance(() => this.invalidateExpenses(item.groupId)),
                        ),
                        map(() => true),
                      )
                    : of(false),
                ),
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

  private afterAcceptance(operation: () => Observable<void>): Observable<void> {
    return defer(operation).pipe(
      catchError((error) => {
        console.error('[EXPENSE] Local update failed after server acceptance', error);
        this.toastService.warnToast('Expense saved. Local data could not be refreshed.');
        return of(void 0);
      }),
    );
  }
}
