import { Injectable, signal } from '@angular/core';
import { BalanceResponse } from '../models/balance-response.model';

/**
 * Balances for one group. Root-provided so the data outlives the balance tab
 * component, which the group screen's @switch destroys whenever another tab is
 * active — that is what lets a pull-to-refresh reload balances while the tab is
 * not even rendered.
 */
@Injectable({ providedIn: 'root' })
export class GroupBalanceStore {
  /** The group the loaded balances belong to. */
  readonly groupId = signal<string | null>(null);
  readonly balance = signal<BalanceResponse | null>(null);
  readonly loading = signal<boolean>(true);

  /** Opening a different group starts fresh; re-entering the same one keeps what it has. */
  enter(groupId: string): void {
    if (this.groupId() === groupId) return;

    this.groupId.set(groupId);
    this.balance.set(null);
    this.loading.set(true);
  }
}
