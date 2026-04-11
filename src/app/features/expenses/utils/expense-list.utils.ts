import { DateHelper } from 'src/app/shared/utils/date.helper';
import { ExpenseListItem, ExpenseListItemDetails } from '../models/expense-list-item.model';

export function mapExpenses(items: ExpenseListItemDetails[]): ExpenseListItem[] {
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
    const d1 = DateHelper.extractYearAndMonth(data[current]?.date);
    const d2 = DateHelper.extractYearAndMonth(e.createdAt);
    if (d1 !== d2) {
      const d3 = DateHelper.extractDateOnly(e.createdAt);
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
