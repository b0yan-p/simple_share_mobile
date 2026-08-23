import { Injectable, signal } from '@angular/core';
import { CachedListStore } from 'src/app/core/store/cached-list-store';
import { ExpenseFilter, ExpenseListItem } from '../models/expense-list-item.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseStore extends CachedListStore<ExpenseListItem> {
  /** Pill filter — view state that has to survive leaving and re-entering the list. */
  readonly activeFilter = signal<ExpenseFilter>('all');

  override reset(key: string): void {
    // A forced refetch of the same group (after a mutation, say) keeps the pill
    // the user chose; only moving to another group clears it.
    if (this.key() !== key) this.activeFilter.set('all');
    super.reset(key);
  }
}
