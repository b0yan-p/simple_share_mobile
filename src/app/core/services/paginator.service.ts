import { computed, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { PageQueryParams } from '../models/base-query-params';

export abstract class PaginatorService {
  protected pageSize = signal<number>(5);
  protected pageIndex = signal<number>(0);
  protected totalCount = signal<number>(0);
  protected pageRequest = signal<PageQueryParams>({ skip: 0, take: this.pageSize() });
  public pageLoading = signal<boolean>(false);

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
    this.pageIndex.set(0);
  }

  loadMoreData(data: any = null) {
    if (!this.hasMoreData()) return;

    this.pageRequest.set({
      skip: this.pageRequest().take * (this.pageIndex() + 1),
      take: this.pageRequest().take,
    });

    this.pageIndex.set(this.pageIndex() + 1);
    this.pageLoading.set(true);
  }
}
