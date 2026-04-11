import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { PageQueryParams } from 'src/app/core/models/base-query-params';
import { PageData } from 'src/app/core/models/page-data';
import { environment } from 'src/environments/environment';
import { CreateExpenseRequest, UpdateExpenseRequest } from '../models/create-expense.model';
import { ExpenseListItemDetails } from '../models/expense-list-item.model';
import { ExpenseDetail } from '../models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseAPIUrl;

  getExpenses(
    groupId: string,
    page: PageQueryParams,
  ): Observable<PageData<ExpenseListItemDetails>> {
    const params = new HttpParams().set('skip', page.skip).set('take', page.take);

    return this.http
      .get<PageData<ExpenseListItemDetails>>(`${this.baseUrl}/Expense/${groupId}`, {
        params,
      })
      .pipe(first());
  }

  getExpense(groupId: string, expenseId: string): Observable<ExpenseDetail> {
    return this.http
      .get<ExpenseDetail>(`${this.baseUrl}/Expense/${groupId}/${expenseId}`)
      .pipe(first());
  }

  createExpense(groupId: string, payload: CreateExpenseRequest): Observable<{ id: string }> {
    return this.http
      .post<{ id: string }>(`${this.baseUrl}/Expense/${groupId}`, payload)
      .pipe(first());
  }

  updateExpense(groupId: string, payload: UpdateExpenseRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Expense/${groupId}`, payload).pipe(first());
  }

  deleteExpense(groupId: string, expenseId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/Expense/${groupId}/${expenseId}`)
      .pipe(first());
  }
}
