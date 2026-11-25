import { inject, Injectable } from '@angular/core';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { SimpleShareIdbService } from '../../core/services/simpleshare-idb.service';
import { GoogleAuthService } from './google-auth.service';
import { TokenStorageService } from './token-storage.service';

const pendingKey = 'account-deletion-cleanup';
const successKey = 'account-deletion-notice';

@Injectable({ providedIn: 'root' })
export class DeletedAccountCleanup {
  private readonly storage = inject(TokenStorageService);
  private readonly google = inject(GoogleAuthService);
  private readonly idb = inject(SimpleShareIdbService);
  readonly ended = new ReplaySubject<void>(1);
  private finishing?: Promise<void>;
  leaving = false;

  get pending(): boolean {
    return localStorage.getItem(pendingKey) !== null;
  }

  finish(showSuccess: boolean): Promise<void> {
    if (this.finishing) return this.finishing;

    localStorage.setItem(pendingKey, showSuccess ? 'confirmed' : 'revoked');
    this.ended.next();
    this.google.signOut().subscribe({ error: () => {} });
    this.finishing = this.clearAndLeave();

    return this.finishing;
  }

  async recover(): Promise<void> {
    if (this.pending) await this.clearAndLeave();
  }

  consumeSuccess(): boolean {
    const show = sessionStorage.getItem(successKey) !== null;
    sessionStorage.removeItem(successKey);

    return show;
  }

  private async clearAndLeave(): Promise<void> {
    await firstValueFrom(this.idb.initialize());

    const db = this.idb.db;
    const stores = Array.from(db.objectStoreNames);
    const tx = db.transaction(stores, 'readwrite');
    const clears = stores.map((name) => tx.objectStore(name).clear());

    // Existing transactions run before this clear. Reject any later writes.
    db.close();

    await Promise.all([...clears, tx.done]);

    if (!(await firstValueFrom(this.storage.clearAll())))
      throw new Error('Session cleanup failed');

    if (localStorage.getItem(pendingKey) === 'confirmed')
      sessionStorage.setItem(successKey, '1');

    this.leaving = true;

    // A fresh application also discards cached Ionic pages and every in-memory store.
    window.history.replaceState(null, '', new URL('welcome', document.baseURI));
    localStorage.removeItem(pendingKey);
    window.location.reload();
  }
}
