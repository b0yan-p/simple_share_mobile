import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { from, map, Observable } from 'rxjs';
import { CreateExpenseRequest } from '../models/create-expense.model';
import { ExpenseListItemDetails } from '../models/expense-list-item.model';

interface ExpenseCacheEntry {
  items: ExpenseListItemDetails[];
  totalCount: number;
  cachedAt: string;
}

export interface PendingExpense {
  tempId: string;
  groupId: string;
  payload: CreateExpenseRequest;
  createdAt: string;
}

interface SimpleShareDB {
  expenses: {
    key: string;
    value: ExpenseCacheEntry;
  };
  pending_expenses: {
    key: string;
    value: PendingExpense;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseIdbService {
  private db!: IDBPDatabase<SimpleShareDB>;

  initialize(): Observable<void> {
    return from(
      openDB<SimpleShareDB>('simpleshare-db', 2, {
        upgrade(db, oldVersion) {
          if (oldVersion < 1) {
            db.createObjectStore('expenses');
          }
          if (oldVersion < 2) {
            db.createObjectStore('pending_expenses', { keyPath: 'tempId' });
          }
        },
      }),
    ).pipe(
      map((db) => {
        this.db = db;
      }),
    );
  }

  saveExpenses(
    groupId: string,
    totalCount: number,
    items: ExpenseListItemDetails[],
  ): Observable<void> {
    return from(
      this.db.put(
        'expenses',
        { items, totalCount, cachedAt: new Date().toISOString() },
        groupId,
      ),
    ).pipe(map(() => void 0));
  }

  getExpenses(
    groupId: string,
  ): Observable<{ items: ExpenseListItemDetails[]; totalCount: number } | null> {
    return from(this.db.get('expenses', groupId)).pipe(
      map((entry) => (entry ? { items: entry.items, totalCount: entry.totalCount } : null)),
    );
  }

  deleteExpenses(groupId: string): Observable<void> {
    return from(this.db.delete('expenses', groupId));
  }

  savePendingExpense(expense: PendingExpense): Observable<void> {
    return from(this.db.put('pending_expenses', expense)).pipe(map(() => void 0));
  }

  getPendingExpenses(): Observable<PendingExpense[]> {
    return from(this.db.getAll('pending_expenses'));
  }

  getPendingExpense(tempId: string): Observable<PendingExpense | undefined> {
    return from(this.db.get('pending_expenses', tempId));
  }

  deletePendingExpense(tempId: string): Observable<void> {
    return from(this.db.delete('pending_expenses', tempId));
  }
}
