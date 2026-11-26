import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, first, EMPTY } from 'rxjs';
import { BaseService } from 'src/app/core/services/base.service';
import { apiErrorMessage } from 'src/app/core/services/api-error';
import { NetworkService } from 'src/app/core/services/network.service';
import { ConnectionItem } from '../models/connection.model';

@Injectable({ providedIn: 'root' })
export class ConnectionService extends BaseService<ConnectionItem> {
  loading = signal(false);
  error = signal<string | null>(null);

  private readonly network = inject(NetworkService);

  protected override get ctrlApi(): string {
    return 'UserConnection';
  }

  protected override get listApi(): string | null {
    return null;
  }

  override getAll(): void {
    this.loading.set(true);
    this.error.set(null);
    this.httpClient
      .get<ConnectionItem[]>(this.baseApi)
      .pipe(
        first(),
        finalize(() => {
          this.loading.set(false);
          this.listSettled.next();
        }),
        catchError((err) => {
          console.error(err);

          // A request that raced the connection dropping fails with a raw
          // "0 Unknown Error"; surface the offline cause instead.
          this.error.set(apiErrorMessage(err, 'Could not load friends.'));
          if (this.items().length) this.toastService.errorToast(this.error()!);
          return EMPTY;
        }),
      )
      .subscribe((data) => {
        this.items.set(data);
      });
  }
}
