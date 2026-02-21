import { Injectable } from '@angular/core';
import { BaseService } from 'src/app/core/services/base.service';
import { DateHelper } from 'src/app/shared/utils/date.helper';
import { ExpenseListItem, ExpenseListItemDetails } from '../models/expense-list-item.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService extends BaseService<ExpenseListItem> {
  constructor() {
    super();
    // super.setPagination(0, 3);
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
}
