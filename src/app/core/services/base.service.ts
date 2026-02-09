import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, filter, finalize, first, map, Observable, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseModel } from '../models/base-model';
import { PageData } from '../models/page-data';
import { PaginatorService } from './paginator.service';
import { ToastService } from './toast.service';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root',
})
export abstract class BaseService<
  ListT extends BaseModel = any,
  ItemT extends BaseModel = any,
  UpdateT extends BaseModel = any,
  CreateT = any,
> extends PaginatorService {
  protected httpClient = inject(HttpClient);
  protected toastService = inject(ToastService);
  protected uiService = inject(UiService);

  protected abstract get ctrlApi(): string;
  protected abstract get listApi(): string | null;

  private rootUrl = environment.baseAPIUrl;

  items = signal<ListT[]>([]);

  public get baseApi(): string {
    return `${this.rootUrl}/${this.ctrlApi}`;
  }

  mapToListItem(item: ItemT): ListT {
    return {} as any;
  }

  public getAll(): void {
    const api = this.buildApiUrl(this.listApi);

    this.pageRequest$
      .pipe(
        switchMap((qp) => {
          this.uiService.listLoading.set(qp.skip === 0);
          this.pageLoading.set(qp.skip > 0);

          return this.httpClient
            .get<PageData<ListT>>(api, {
              params: { skip: this.pageRequest().skip, take: this.pageRequest().take },
            })
            .pipe(
              first(),
              map((e) => {
                this.totalCount.set(e.totalCount);

                return e.data;
              }),
              tap(() => {
                this.uiService.listLoading.set(false);
                this.pageLoading.set(false);
              }),
              catchError((err) => {
                console.error(err);
                this.uiService.listLoading.set(false);
                this.pageLoading.set(false);
                this.toastService.errorToast(err.message);
                throw err;
              }),
            );
        }),
      )
      .subscribe((data) => {
        console.log('get list data: ', data);
        if (this.pageRequest().skip === 0) this.items.set([...data]);
        else this.items.set([...(this.items() ?? []), ...data]);
      });
  }

  public getOne(route: ActivatedRoute): Observable<ItemT> {
    return route.params.pipe(
      first(),
      filter((p) => p['id'] !== 'new'),
      switchMap((p) => this.httpClient.get<ItemT>(`${this.baseApi}/${p['id']}`)),
      finalize(() => this.uiService.itemLoading.set(false)),
      catchError((err) => {
        console.error(err);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
  }

  public update(payload: UpdateT): Observable<ItemT> {
    this.uiService.itemLoading.set(true);

    return this.httpClient.put<ItemT>(`${this.baseApi}`, payload).pipe(
      first(),
      finalize(() => this.uiService.itemLoading.set(false)),
      tap((res) => {
        let newData: ListT[] = this.items().map((e) =>
          e.id != res.id ? { ...e } : this.mapToListItem(res),
        );
        this.items.set([...newData]);
      }),
      catchError((err) => {
        console.error(err);
        this.uiService.itemLoading.set(false);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
  }

  public create(payload: CreateT): Observable<ItemT> {
    this.uiService.itemLoading.set(true);

    return this.httpClient.post<ItemT>(`${this.baseApi}`, payload).pipe(
      first(),
      finalize(() => this.uiService.itemLoading.set(false)),
      tap((res) => {
        this.items.set([this.mapToListItem(res), ...this.items()]);
      }),
      catchError((err) => {
        console.error(err);
        this.uiService.itemLoading.set(false);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
  }

  public delete(id: string) {
    this.uiService.itemLoading.set(true);

    return this.httpClient.delete(`${this.baseApi}/${id}`).pipe(
      first(),
      finalize(() => this.uiService.itemLoading.set(false)),
      tap((res) => {
        const i = this.items().findIndex((e) => e.id === id);

        if (i === -1) return;

        const arr = [...this.items()];
        arr.splice(i, 1);
        this.items.set([...arr]);
      }),
      catchError((err) => {
        console.error(err);
        this.uiService.itemLoading.set(false);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
  }

  private buildApiUrl(url: string | null = null) {
    if (!url) return `${this.baseApi}`;

    return `${this.baseApi}/${url}`;
  }
}
