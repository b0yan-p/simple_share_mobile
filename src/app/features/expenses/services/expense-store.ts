import { Injectable, signal } from '@angular/core';
import { ExpenseListItem } from '../models/expense-list-item.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseStore {
  readonly expenses = signal<ExpenseListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<null | string>(null);

  setExpenses(items: ExpenseListItem[]): void {
    this.expenses.set(items);
  }

  appendExpenses(items: ExpenseListItem[]): void {
    this.expenses.update((current) => [...current, ...items]);
  }

  setLoading(value: boolean): void {
    this.loading.set(value);
  }

  setError(message: string | null): void {
    this.error.set(message);
  }

  clear(): void {
    this.expenses.set([]);
    this.loading.set(false);
    this.error.set(null);
  }
}
