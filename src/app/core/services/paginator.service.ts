import { computed, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { PageQueryParams } from '../models/base-query-params';

export abstract class PaginatorService {
  readonly pageSize = signal<number>(5);
  protected pageRequest = signal<PageQueryParams>({ skip: 0, take: this.pageSize() });
  public pageLoading = signal<boolean>(false);

  totalCount = signal<number>(0);
  hasMoreData = computed(
    () => this.pageRequest().skip + this.pageRequest().take < this.totalCount(),
  );

  readonly pageRequest$ = toObservable(this.pageRequest).pipe(
    distinctUntilChanged((a, b) => a.skip === b.skip && a.take === b.take),
  );

  public setPagination(skip: number = 0, take: number = this.pageSize()) {
    this.pageRequest.set({ skip, take });
  }

  public resetPagination(skip: number = 0, take: number = this.pageSize()) {
    this.setPagination(skip, take);
  }

  loadMoreData(data: any = null) {
    if (!this.hasMoreData()) return;

    this.pageRequest.set({
      skip: this.pageRequest().take + this.pageRequest().skip,
      take: this.pageRequest().take,
    });

    this.pageLoading.set(true);
  }
}
