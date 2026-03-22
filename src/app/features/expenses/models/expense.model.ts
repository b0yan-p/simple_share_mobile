export interface ExpenseDetail {
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
  memberId: string;
  memberName: string;
  amount: number;
}
