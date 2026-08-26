import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, first } from 'rxjs';
import { BaseService } from 'src/app/core/services/base.service';
import { NetworkService } from 'src/app/core/services/network.service';
import { ConnectionItem } from '../models/connection.model';

@Injectable({ providedIn: 'root' })
export class ConnectionService extends BaseService<ConnectionItem> {
  loading = signal(false);

  private readonly network = inject(NetworkService);

  protected override get ctrlApi(): string {
    return 'UserConnection';
  }

  protected override get listApi(): string | null {
    return null;
  }

  override getAll(): void {
    this.loading.set(true);
    this.httpClient
      .get<ConnectionItem[]>(this.baseApi)
      .pipe(
        first(),
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error(err);

          // A request that raced the connection dropping fails with a raw
          // "0 Unknown Error"; surface the offline cause instead.
          if (!this.network.isOnline()) {
            this.toastService.infoToast("You're offline. Showing what we have.");
          } else {
            this.toastService.errorToast(err.message);
          }

          throw err;
        }),
      )
      .subscribe((data) => {
        this.items.set(data);
      });
  }
}
