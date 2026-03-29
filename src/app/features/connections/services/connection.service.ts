import { Injectable, signal } from '@angular/core';
import { catchError, finalize, first } from 'rxjs';
import { BaseService } from 'src/app/core/services/base.service';
import { ConnectionItem } from '../models/connection.model';

@Injectable({ providedIn: 'root' })
export class ConnectionService extends BaseService<ConnectionItem> {
  loading = signal(false);

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
          this.toastService.errorToast(err.message);
          throw err;
        }),
      )
      .subscribe((data) => {
        this.items.set(data);
      });
  }
}
