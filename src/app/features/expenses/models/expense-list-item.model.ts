export interface ExpenseListItem {
  id: string;
  date: string;
  expenses: ExpenseListItemDetails[];
}

export interface ExpenseListItemDetails {
  id: string;
  description: string;
  expenseDate: string;
  createdAt: string;
  amount: number;
  net: number;
  isSettleUp: boolean;
  paidByMembers: string[];
}

/** Client-side pill filter applied over the pages loaded so far. */
export type ExpenseFilter = 'all' | 'unsettled' | 'settled';
