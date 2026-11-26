import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { GroupBalanceStore } from '../store/group-balance-store';
import { apiErrorMessage } from 'src/app/core/services/api-error';
import { ToastService } from 'src/app/core/services/toast.service';
import { GroupService } from './group.service';

/**
 * Balances have no offline cache — the endpoint is the only source — so this is
 * a plain network load that parks its result in a root-provided store.
 */
@Injectable({ providedIn: 'root' })
export class GroupBalanceFacade {
  private readonly groupService = inject(GroupService);
  private readonly toast = inject(ToastService);
  readonly store = inject(GroupBalanceStore);

  /**
   * Fetches balances for `groupId` and completes once the store reflects them.
   * Errors are swallowed the way the rest of the group screen swallows them: a
   * failed balance load must not take the surrounding refresh down with it.
   */
  loadBalances(groupId: string): Observable<void> {
    this.store.enter(groupId);
    this.store.loading.set(true);
    this.store.error.set(null);

    return this.groupService.getGroupBalances(groupId).pipe(
      tap((balance) => this.store.balance.set(balance)),
      catchError((err) => {
        console.warn('[API ERROR] group balances', err);
        const message = apiErrorMessage(err, 'Could not load balances.');
        this.store.error.set(message);
        if (this.store.balance()) this.toast.errorToast(message);
        return of(null);
      }),
      tap(() => this.store.loading.set(false)),
      map(() => void 0),
    );
  }
}
