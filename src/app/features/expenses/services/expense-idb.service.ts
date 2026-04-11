import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { ExpenseListItemDetails } from '../models/expense-list-item.model';

interface ExpenseCacheEntry {
  items: ExpenseListItemDetails[];
  totalCount: number;
  cachedAt: string;
}

interface SimpleShareDB {
  expenses: {
    key: string;
    value: ExpenseCacheEntry;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseIdbService {
  private db!: IDBPDatabase<SimpleShareDB>;

  async initialize(): Promise<void> {
    this.db = await openDB<SimpleShareDB>('simpleshare-db', 1, {
      upgrade(db) {
        if (db.objectStoreNames.contains('expenses')) return;
        db.createObjectStore('expenses');
      },
    });
  }

  async saveExpenses(
    groupId: string,
    totalCount: number,
    items: ExpenseListItemDetails[],
  ): Promise<void> {
    await this.db.put(
      'expenses',
      { items, totalCount, cachedAt: new Date().toISOString() },
      groupId,
    );
  }

  async getExpenses(
    groupId: string,
  ): Promise<{ items: ExpenseListItemDetails[]; totalCount: number } | null> {
    const entry = await this.db.get('expenses', groupId);
    if (!entry) return null;
    return { items: entry.items, totalCount: entry.totalCount };
  }

  async deleteExpenses(groupId: string): Promise<void> {
    await this.db.delete('expenses', groupId);
  }
}
