import { computed, inject, Injectable, signal } from '@angular/core';
import { BaseApiService } from '../../services/base-api.service';
import { ListState, LoadStatus } from '../models/list-state.model';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Store<T, CreateT = any, UpdateT = any> {
  protected api!: BaseApiService<T, CreateT, UpdateT>;

  private state = signal<ListState<T>>(new ListState());

  status = computed(() => this.state().status);
  items = computed(() => this.state().items);
  error = computed(() => this.state().error);

  load(): void {
    if (this.state().status === LoadStatus.Loading) return;

    this.state.update((s) => ({ ...s, status: LoadStatus.Loading, error: null }));

    this.api
      .getAll()
      .pipe(
        finalize(() => {
          this.state.update((s) =>
            s.status === LoadStatus.Loading ? { ...s, status: LoadStatus.Ready } : s,
          );
        }),
      )
      .subscribe({
        next: (items) => {
          console.log('items in store: ', items);
          this.state.update((s) => ({ ...s, items, error: null }));
        },
        error: (err) => {
          this.state.update((s) => ({
            ...s,
            status: LoadStatus.Error,
            error: err?.message ?? 'Something went wrong in store.',
          }));
        },
      });
  }
}
