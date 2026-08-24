import { inject, Injectable } from '@angular/core';
import {
  catchError,
  filter,
  finalize,
  merge,
  Observable,
  of,
  skip,
  Subscription,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { CreateGroup } from '../models/create-group.model';
import { GroupOverview } from '../models/group-overview.model';
import { Group, GroupListItem } from '../models/group.model';
import { UpdateGroup } from '../models/update-group.model';
import { GroupListStore } from '../store/group-list-store';
import { RecentGroupsStore } from '../store/recent-groups-store';
import { mapGroupListItems } from '../utils/group-list.utils';
import { GroupApiService } from './group-api.service';
import { GroupIdbService } from './group-idb.service';
import { GroupPaginatorService } from './group-paginator.service';
import { GroupService } from './group.service';

const OFFLINE_MUTATION_MESSAGE = 'You are offline. Connect to the internet and try again.';

@Injectable({
  providedIn: 'root',
})
export class GroupFacade {
  private readonly groupApi = inject(GroupApiService);
  private readonly paginator = inject(GroupPaginatorService);
  readonly store = inject(GroupListStore);
  readonly recentStore = inject(RecentGroupsStore);
  private readonly toastService = inject(ToastService);
  private readonly ui = inject(UiService);
  private readonly networkService = inject(NetworkService);
  private readonly idb = inject(GroupIdbService);
  private readonly groupService = inject(GroupService);

  $loadGroups?: Subscription;
  $loadRecentGroups?: Subscription;

  // #region load methods
  /**
   * Reloads the list from page 0. There is no freshness guard by design — the
   * group list keeps no pagination state, so every entry to the screen refetches.
   * The previous items stay on screen while the reload runs, so the cache paint
   * replaces them rather than blanking the list first.
   */
  loadGroups(): void {
    this.$loadGroups?.unsubscribe();
    this.store.setLoading();
    this.paginator.resetPagination();
    this.paginator.totalCount.set(0);

    const firstPage = { skip: 0, take: this.paginator.pageSize() };

    // Use of(firstPage) to trigger the initial load synchronously — avoids the
    // ReplaySubject replay race where pageRequest$ would emit the stale skip value
    // before resetPagination()'s effect fires, causing a double request.
    // pageRequest$ is used only for "load more" (skip > 0). This only holds
    // because resetPagination() and subscribe() sit in the same sync block.
    const ref$ = merge(
      of(firstPage),
      this.paginator.pageRequest$.pipe(
        skip(1),
        filter((page) => page.skip > 0),
      ),
    ).pipe(
      switchMap((page) => {
        this.paginator.pageLoading.set(page.skip > 0);

        if (page.skip === 0) {
          return this.loadFirstPage(page);
        }

        return this.loadNextPage(page);
      }),
    );

    this.$loadGroups = ref$.subscribe({
      error: (err) => console.log('error in group facade: ', err),
    });
  }

  private loadFirstPage(page: { skip: number; take: number }) {
    return this.idb.getGroups().pipe(
      switchMap((cached) => {
        if (cached) {
          console.log(
            `[IDB HIT] groups=${cached.items.length}, totalCount=${cached.totalCount}`,
          );
          this.store.setItems(mapGroupListItems(cached.items));
          this.store.setReady();
        }

        if (!this.networkService.isOnline()) {
          this.paginator.pageLoading.set(false);
          // totalCount stays 0 on purpose: hasMoreData is then false, so the
          // infinite scroll is disabled instead of firing a request that can
          // only end in a "cannot load more while offline" toast.
          if (!cached) {
            this.store.setItems([]);
            this.store.setReady();
          }
          return of([] as GroupListItem[]);
        }

        return this.groupApi.getGroups(page).pipe(
          switchMap((res) => {
            const items = res?.data ?? [];
            this.paginator.totalCount.set(res.totalCount);
            console.log(`[API] groups=${items.length}, totalCount=${res.totalCount}, skip=0`);

            if (!items.length) {
              this.paginator.pageLoading.set(false);
              if (!cached) {
                this.store.setItems([]);
                this.store.setReady();
              } else if (res.totalCount > 0) {
                this.toastService.warnToast('Could not refresh groups. Showing cached data.');
              }
              return of([] as GroupListItem[]);
            }

            return this.idb.saveGroups(res.totalCount, items).pipe(
              tap(() => {
                this.paginator.pageLoading.set(false);
                this.store.setItems(mapGroupListItems(items));
                this.store.setReady();
              }),
              switchMap(() => of([] as GroupListItem[])),
            );
          }),
          catchError((err) => this.handleError(err)),
        );
      }),
    );
  }

  private loadNextPage(page: { skip: number; take: number }) {
    if (!this.networkService.isOnline()) {
      this.paginator.pageLoading.set(false);
      this.toastService.errorToast('Cannot load more while offline');
      return of([] as GroupListItem[]);
    }

    return this.groupApi.getGroups(page).pipe(
      switchMap((res) => {
        const newItems = res?.data ?? [];
        this.paginator.totalCount.set(res.totalCount);
        console.log(
          `[API] groups=${newItems.length}, totalCount=${res.totalCount}, skip=${page.skip}`,
        );

        if (!newItems.length) {
          this.paginator.pageLoading.set(false);
          return of([] as GroupListItem[]);
        }

        return this.idb.getGroups().pipe(
          switchMap((existing) => {
            const allItems = [...(existing?.items ?? []), ...newItems];
            return this.idb.saveGroups(res.totalCount, allItems).pipe(
              tap(() => {
                this.paginator.pageLoading.set(false);
                this.store.setItems(mapGroupListItems(allItems));
                this.store.setReady();
              }),
              switchMap(() => of([] as GroupListItem[])),
            );
          }),
        );
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  /**
   * Keeps the stream alive instead of rethrowing the way BaseService.getAll does
   * — a rethrow kills the pageRequest$ subscription and the paginator with it.
   * totalCount is left alone on purpose: zeroing it would permanently disable
   * load-more after one transient failure on a later page.
   */
  private handleError(err: { message?: string }) {
    console.warn('[API ERROR] groups', err);
    const message = err?.message ?? 'Failed to load groups';
    this.store.setError(message);
    this.paginator.pageLoading.set(false);
    this.toastService.errorToast(message);
    return of([] as GroupListItem[]);
  }
  /**
   * Same cache-first-then-network shape as loadFirstPage, minus the paginator:
   * /group/recent has no paging. No freshness guard by design — every entry to
   * the home screen refetches, and the previous items stay on screen while the
   * reload runs so the cache paint replaces them rather than blanking the list.
   */
  loadRecentGroups(): void {
    this.$loadRecentGroups?.unsubscribe();
    this.recentStore.setLoading();

    const ref$ = this.idb.getRecentGroups().pipe(
      switchMap((cached) => {
        if (cached) {
          console.log(`[IDB HIT] recentGroups=${cached.length}`);
          this.recentStore.setItems(mapGroupListItems(cached));
          this.recentStore.setReady();
        }

        if (!this.networkService.isOnline() && !cached) {
          this.recentStore.setItems([]);
          this.recentStore.setReady();
        }

        if (!this.networkService.isOnline()) {
          return of([] as GroupListItem[]);
        }

        return this.groupApi.getRecentGroups().pipe(
          switchMap((res) => {
            const items = res ?? [];
            console.log(`[API] recentGroups=${items.length}`);

            if (!items.length) {
              if (!cached) {
                this.recentStore.setItems([]);
                this.recentStore.setReady();
              } else {
                this.toastService.warnToast(
                  'Could not refresh recent groups. Showing cached data.',
                );
              }
              return of([] as GroupListItem[]);
            }

            return this.idb.saveRecentGroups(items).pipe(
              tap(() => {
                this.recentStore.setItems(mapGroupListItems(items));
                this.recentStore.setReady();
              }),
              switchMap(() => of([] as GroupListItem[])),
            );
          }),
          catchError((err) => this.handleRecentError(err)),
        );
      }),
    );

    this.$loadRecentGroups = ref$.subscribe({
      error: (err) => console.log('error in group facade: ', err),
    });
  }

  /** Swallows the error the way handleError does, so a cache paint survives it. */
  private handleRecentError(err: { message?: string }) {
    console.warn('[API ERROR] recent groups', err);
    const message = err?.message ?? 'Failed to load recent groups';
    this.recentStore.setError(message);
    this.toastService.errorToast(message);
    return of([] as GroupListItem[]);
  }

  /**
   * Network-first with a cache fallback, and **null instead of an error** on a
   * total miss: the group screen renders its shell around this, so an error here
   * used to take the whole page down with it.
   */
  loadGroupOverview(groupId: string): Observable<GroupOverview | null> {
    if (!this.networkService.isOnline()) return this.idb.getGroupOverview(groupId);

    return this.groupService.groupOverview(groupId).pipe(
      tap((overview) => this.idb.saveGroupOverview(groupId, overview).subscribe()),
      catchError(() => this.idb.getGroupOverview(groupId)),
    );
  }
  // #endregion

  // #region mutation methods
  createGroup(payload: CreateGroup): Observable<Group> {
    if (!this.networkService.isOnline()) return this.offlineMutation();

    this.ui.itemLoading.set(true);
    return this.groupApi.createGroup(payload).pipe(
      finalize(() => this.ui.itemLoading.set(false)),
      tap(() => this.reloadGroupLists()),
    );
  }

  updateGroup(payload: UpdateGroup): Observable<Group> {
    if (!this.networkService.isOnline()) return this.offlineMutation();

    this.ui.itemLoading.set(true);
    return this.groupApi.updateGroup(payload).pipe(
      finalize(() => this.ui.itemLoading.set(false)),
      tap(() => this.reloadGroupLists()),
    );
  }

  deleteGroup(id: string): Observable<void> {
    if (!this.networkService.isOnline()) return this.offlineMutation();

    return this.groupApi.deleteGroup(id).pipe(tap(() => this.reloadGroupLists()));
  }

  /**
   * A mutation changes both lists, and the home tab stays alive, so its
   * ionViewWillEnter cannot be relied on to pick the change up.
   */
  private reloadGroupLists(): void {
    this.loadGroups();
    this.loadRecentGroups();
  }

  /**
   * No offline queue for groups (unlike pending expenses). The message is shown
   * by the caller's error handler, so the facade does not toast it as well.
   */
  private offlineMutation<T>(): Observable<T> {
    return throwError(() => new Error(OFFLINE_MUTATION_MESSAGE));
  }
  // #endregion
}
