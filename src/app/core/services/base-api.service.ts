import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, first, map, Observable, tap } from 'rxjs';
import { PageData } from '../models/page-data';
import { environment } from 'src/environments/environment';
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

    return this.httpClient.get<PageData<T>>(listApi).pipe(
      first(),
      map((e) => [...e.data]),
      catchError((err) => {
        console.error(err);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
  }

  public getOne(id: string, url?: string): Observable<T> {
    const api = url ?? `${this.baseApi}/${id}`;
    console.log({ api });
    return defer(() => {
      this.uiService.itemLoading.set(true);
      return this.httpClient.get<T>(api).pipe(
        first(),
        tap(() => this.uiService.itemLoading.set(false)),
        catchError((err) => {
          console.error(err);
          this.uiService.itemLoading.set(false);
          this.toastService.errorToast(err.message);
          throw err;
        }),
      );
    });
  }

  public create(payload: CreateT, url?: string): Observable<T> {
    const api = url ?? this.baseApi;
    return this.httpClient.post<T>(api, payload).pipe(
      first(),
      catchError((err) => {
        console.error(err);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
  }

  public update(payload: UpdateT, url?: string): Observable<T> {
    const api = url ?? this.baseApi;
    return this.httpClient.put<T>(api, payload).pipe(
      first(),
      catchError((err) => {
        console.error(err);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
  }

  public delete(id: string, url?: string): Observable<{ id: string }> {
    const api = url ?? `${this.ctrlApi}/id`;
    return this.httpClient.delete<{ id: string }>(api).pipe(
      first(),
      catchError((err) => {
        console.error(err);
        this.toastService.errorToast(err.message);
        throw err;
      }),
    );
  }
}
