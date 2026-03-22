export interface MemberAmountEntry {
  memberId: string;
  amount: number;
}

export interface CreateExpenseRequest {
  description: string;
  expenseDate: string;
  totalAmount: number;
  payments: MemberAmountEntry[];
  splits: MemberAmountEntry[];
}
