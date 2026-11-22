/** Internal draft allocation, expressed in original currency. */
export interface MemberAmountEntry {
  memberId: string;
  amount: number;
}
export interface OriginalAllocation {
  memberId: string;
  originalAmount: number;
}
export interface ExpenseFinancialInput {
  expenseDate: string;
  originalAmount: number;
  originalCurrency: string;
  payments: OriginalAllocation[];
  splits: OriginalAllocation[];
}
export interface CreateExpenseRequest extends ExpenseFinancialInput {
  clientExpenseId: string;
  description: string;
}
export interface UpdateExpenseRequest {
  id: string;
  description?: string;
  financial?: ExpenseFinancialInput;
}
