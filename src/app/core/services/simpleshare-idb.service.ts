import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { from, map, Observable, of } from 'rxjs';
import { SimpleShareDB } from 'src/app/core/models/simpleshare-db.types';

@Injectable({
  providedIn: 'root',
})
export class SimpleShareIdbService {
  db!: IDBPDatabase<SimpleShareDB>;

  initialize(): Observable<void> {
    if (this.db) return of(void 0);

    return from(
      openDB<SimpleShareDB>('simpleshare-db', 4, {
        upgrade(db, oldVersion, _newVersion, transaction) {
          for (const name of [
            'expenses',
            'pending_expenses',
            'group_members',
            'groups',
            'group_overview',
          ] as const) {
            if (!db.objectStoreNames.contains(name)) {
              if (name === 'pending_expenses')
                db.createObjectStore(name, { keyPath: 'tempId' });
              else db.createObjectStore(name);
            } else if (oldVersion < 4 && name !== 'group_members')
              transaction.objectStore(name).clear();
          }
        },
      }),
    ).pipe(
      map((db) => {
        this.db = db;
      }),
    );
  }
}
