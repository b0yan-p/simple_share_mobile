import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BalanceSummary } from '../models/balance-summary.model';

@Injectable({
  providedIn: 'root',
})
export class BalanceSummaryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseAPIUrl}/balance`;

  getMyBalanceSummary(): Observable<BalanceSummary> {
    return this.http.get<BalanceSummary>(`${this.baseUrl}/me`).pipe(first());
  }
}
