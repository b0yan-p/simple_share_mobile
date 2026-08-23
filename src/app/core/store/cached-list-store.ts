import { signal } from '@angular/core';
import { LoadStatus } from './models/list-state.model';

/**
 * Base for a list whose contents belong to one owner key (a groupId, for example)
 * and stay valid only for a while. Subclasses add their own view state and are
 * provided in root, so the data survives component destruction — the guard in the
 * owning facade is what decides whether a re-entry refetches.
 */
export abstract class CachedListStore<T> {
  /** How long loaded data stays fresh before a re-entry refetches it. */
  protected readonly ttlMs: number = 1 * 60 * 1000;

  /** Who the loaded data belongs to. For group-scoped lists this is the groupId. */
  readonly key = signal<string | null>(null);
  readonly items = signal<T[]>([]);
  readonly status = signal<LoadStatus>(LoadStatus.Idle);
  readonly error = signal<string | null>(null);
  /** Epoch ms of the last successful load; null while nothing has loaded. */
  readonly loadedAt = signal<number | null>(null);

  /**
   * A method rather than a computed: Date.now() is not a reactive source, so a
   * computed would cache the first answer and never expire.
   */
  isFreshFor(key: string): boolean {
    const loadedAt = this.loadedAt();

    if (this.key() !== key) return false;
    if (this.status() !== LoadStatus.Ready) return false;
    if (loadedAt === null) return false;

    return Date.now() - loadedAt <= this.ttlMs;
  }

  setItems(items: T[]): void {
    this.items.set(items);
  }

  setLoading(): void {
    this.status.set(LoadStatus.Loading);
    this.error.set(null);
  }

  setReady(): void {
    this.status.set(LoadStatus.Ready);
    this.error.set(null);
    this.loadedAt.set(Date.now());
  }

  setError(message: string | null): void {
    this.status.set(LoadStatus.Error);
    this.error.set(message);
    this.loadedAt.set(null);
  }

  /** Marks the data stale without dropping it, so the next entry refetches. */
  invalidate(): void {
    this.status.set(LoadStatus.Idle);
    this.loadedAt.set(null);
  }

  /** Starts a clean session for `key`, discarding anything held for a previous one. */
  reset(key: string): void {
    this.key.set(key);
    this.items.set([]);
    this.status.set(LoadStatus.Idle);
    this.error.set(null);
    this.loadedAt.set(null);
  }
}
