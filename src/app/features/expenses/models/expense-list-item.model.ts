export interface ExpenseListItem {
  id: string;
  date: string;
  expenses: ExpenseListItemDetails[];
}

export interface ExpenseListItemDetails {
  groupCurrency: string;
  originalCurrency: string;
  originalAmount: number;
  id: string;
  description: string;
  expenseDate: string;
  createdAt: string;
  amount: number;
  net: number;
  isSettleUp: boolean;
  payers?: { memberId: string; displayName: string }[];
  paidByMembers: string[];
}

/** Client-side pill filter applied over the pages loaded so far. */
export type ExpenseFilter = 'all' | 'unsettled' | 'settled';
