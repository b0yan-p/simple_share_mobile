import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { from, map, Observable } from 'rxjs';
import { SimpleShareDB } from 'src/app/core/models/simpleshare-db.types';

@Injectable({
  providedIn: 'root',
})
export class SimpleShareIdbService {
  db!: IDBPDatabase<SimpleShareDB>;

  initialize(): Observable<void> {
    return from(
      openDB<SimpleShareDB>('simpleshare-db', 1, {
        upgrade(db) {
          db.createObjectStore('expenses');
          db.createObjectStore('pending_expenses', { keyPath: 'tempId' });
          db.createObjectStore('group_members');
        },
      }),
    ).pipe(
      map((db) => {
        this.db = db;
      }),
    );
  }
}
