import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { BaseService } from 'src/app/core/services/base.service';
import { DateHelper } from 'src/app/shared/utils/date.helper';
import { CreateExpenseRequest, UpdateExpenseRequest } from '../models/create-expense.model';
import { ExpenseListItem, ExpenseListItemDetails } from '../models/expense-list-item.model';
import { ExpenseDetail } from '../models/expense.model';
import { SettleUpRequest } from '../models/settle-up-request.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService extends BaseService<ExpenseListItem> {
  constructor() {
    super();
    super.setPagination(0, 5);
  }

  protected override get ctrlApi(): string {
    return 'expense';
  }

  protected override get listApi(): string | null {
    return null;
  }

  // TODO refactor this so i am not using my base service for caching
  override customListMap(items: any[]): ExpenseListItem[] {
    if (!items.length || items.length === 0) return [];

    const data: ExpenseListItem[] = [
      {
        id: '0',
        date: DateHelper.extractDateOnly(items[0].createdAt),
        expenses: [],
      },
    ];

    let current = 0;
    items.forEach((e: ExpenseListItemDetails, i: number) => {
      let d1 = DateHelper.extractYearAndMonth(data[current]?.date);
      let d2 = DateHelper.extractYearAndMonth(e.createdAt);
      if (d1 !== d2) {
        let d3 = DateHelper.extractDateOnly(e.createdAt);
        data.push({
          id: i + '',
          date: d3,
          expenses: [{ ...e }],
        });
        current++;
      } else {
        data[current].expenses.push({ ...e });
      }
    });

    return data;
  }

  public createExpense(
    groupId: string,
    payload: CreateExpenseRequest,
  ): Observable<{ id: string }> {
    return this.httpClient
      .post<{ id: string }>(`${this.baseApi}/${groupId}`, payload)
      .pipe(first());
  }

  public getExpense(groupId: string, expenseId: string): Observable<ExpenseDetail> {
    return this.httpClient
      .get<ExpenseDetail>(`${this.baseApi}/${groupId}/${expenseId}`)
      .pipe(first());
  }

  public updateExpense(groupId: string, payload: UpdateExpenseRequest): Observable<void> {
    return this.httpClient.put<void>(`${this.baseApi}/${groupId}`, payload).pipe(first());
  }

  public deleteExpense(groupId: string, expenseId: string): Observable<void> {
    return this.httpClient
      .delete<void>(`${this.baseApi}/${groupId}/${expenseId}`)
      .pipe(first());
  }

  public settleUp(groupId: string, request: SettleUpRequest): Observable<void> {
    return this.httpClient
      .post<void>(`${this.baseApi}/${groupId}/settleUp`, request)
      .pipe(first());
  }
}
