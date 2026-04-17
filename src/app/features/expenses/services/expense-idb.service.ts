import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { PendingExpense } from 'src/app/core/models/simpleshare-db.types';
import { SimpleShareIdbService } from 'src/app/core/services/simpleshare-idb.service';
import { ExpenseListItemDetails } from '../models/expense-list-item.model';

export { PendingExpense } from 'src/app/core/models/simpleshare-db.types';

@Injectable({
  providedIn: 'root',
})
export class ExpenseIdbService {
  private readonly idb = inject(SimpleShareIdbService);
  private readonly expensesStore = 'expenses';
  private readonly pendingExpensesStore = 'pending_expenses';

  saveExpenses(
    groupId: string,
    totalCount: number,
    items: ExpenseListItemDetails[],
  ): Observable<void> {
    return from(
      this.idb.db.put(
        this.expensesStore,
        { items, totalCount, cachedAt: new Date().toISOString() },
        groupId,
      ),
    ).pipe(map(() => void 0));
  }

  getExpenses(
    groupId: string,
  ): Observable<{ items: ExpenseListItemDetails[]; totalCount: number } | null> {
    return from(this.idb.db.get(this.expensesStore, groupId)).pipe(
      map((entry) => (entry ? { items: entry.items, totalCount: entry.totalCount } : null)),
    );
  }

  deleteExpenses(groupId: string): Observable<void> {
    return from(this.idb.db.delete(this.expensesStore, groupId));
  }

  savePendingExpense(expense: PendingExpense): Observable<void> {
    return from(this.idb.db.put(this.pendingExpensesStore, expense)).pipe(map(() => void 0));
  }

  getPendingExpenses(): Observable<PendingExpense[]> {
    return from(this.idb.db.getAll(this.pendingExpensesStore));
  }

  getPendingExpense(tempId: string): Observable<PendingExpense | undefined> {
    return from(this.idb.db.get(this.pendingExpensesStore, tempId));
  }

  deletePendingExpense(tempId: string): Observable<void> {
    return from(this.idb.db.delete(this.pendingExpensesStore, tempId));
  }
}
