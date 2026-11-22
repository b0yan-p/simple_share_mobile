export interface ExpenseDetail {
  groupCurrency: string;
  originalCurrency: string;
  originalAmount: number;
  exchangeRate: number;
  exchangeRateDate: string | null;
  id: string;
  description: string;
  expenseDate: string;
  amount: number;
  isSettleUp: boolean;
  createdInfo: ExpenseLogInfo;
  modifiedInfo?: ExpenseLogInfo;
  paidBy: ExpenseMemberAmount[];
  splittedBy: ExpenseMemberAmount[];
}

export interface ExpenseLogInfo {
  memberId: string;
  memberName: string;
  modificationDate: string;
}

export interface ExpenseMemberAmount {
  originalAmount: number;
  memberId: string;
  memberName: string;
  amount: number;
}
