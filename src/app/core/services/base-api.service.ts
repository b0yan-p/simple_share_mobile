import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, first, map, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PageData } from '../models/page-data';
import { ToastService } from './toast.service';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root',
})
export abstract class BaseApiService<T, CreateT = any, UpdateT = any> {
  protected httpClient = inject(HttpClient);
  protected toastService = inject(ToastService);
  protected uiService = inject(UiService);

  protected abstract ctrlApi: string;

  private rootUrl = environment.baseAPIUrl;

  public get baseApi(): string {
    return `${this.rootUrl}/${this.ctrlApi}`;
  }

  // TODO implement pagination
  public getAll(url?: string): Observable<T[]> {
    const listApi = url ?? `${this.baseApi}?skip=0&take=10`;

    const ref = this.httpClient.get<PageData<T>>(listApi).pipe(
      first(),
      map((e) => [...e.data]),
      tap(() => this.uiService.listLoading.set(false)),
      catchError((err) => {
        console.error(err);
        this.uiService.listLoading.set(false);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
    return defer(() => {
      this.uiService.listLoading.set(true);
      return ref;
    });
  }

  public getOne(id: string, url?: string): Observable<T> {
    const api = url ?? `${this.baseApi}/${id}`;

    const ref = this.httpClient.get<T>(api).pipe(
      first(),
      tap(() => this.uiService.itemLoading.set(false)),
      catchError((err) => {
        console.error(err);
        this.uiService.itemLoading.set(false);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );

    return defer(() => {
      this.uiService.itemLoading.set(true);
      return ref;
    });
  }

  public create(payload: CreateT, url?: string): Observable<T> {
    const api = url ?? this.baseApi;
    const ref = this.httpClient.post<T>(api, payload).pipe(
      first(),
      tap(() => this.uiService.itemLoading.set(false)),
      catchError((err) => {
        console.error(err);
        this.uiService.itemLoading.set(false);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );

    return defer(() => {
      this.uiService.itemLoading.set(true);
      return ref;
    });
  }

  public update(payload: UpdateT, url?: string): Observable<T> {
    const api = url ?? this.baseApi;
    const ref = this.httpClient.put<T>(api, payload).pipe(
      first(),
      tap(() => this.uiService.itemLoading.set(false)),
      catchError((err) => {
        console.error(err);
        this.uiService.itemLoading.set(false);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );

    return defer(() => {
      this.uiService.itemLoading.set(true);
      return ref;
    });
  }

  public delete(id: string, url?: string): Observable<{ id: string }> {
    const api = url ?? `${this.ctrlApi}/${id}`;
    const ref = this.httpClient.delete<{ id: string }>(api).pipe(
      first(),
      tap(() => this.uiService.itemLoading.set(false)),
      catchError((err) => {
        console.error(err);
        this.uiService.itemLoading.set(false);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );

    return defer(() => {
      this.uiService.itemLoading.set(true);
      return ref;
    });
  }
}
