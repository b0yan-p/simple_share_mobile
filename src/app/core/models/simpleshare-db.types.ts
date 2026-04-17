import { CreateExpenseRequest } from 'src/app/features/expenses/models/create-expense.model';
import { ExpenseListItemDetails } from 'src/app/features/expenses/models/expense-list-item.model';
import { GroupMember } from 'src/app/features/groups/models/group-member.model';

export interface ExpenseCacheEntry {
  items: ExpenseListItemDetails[];
  totalCount: number;
  cachedAt: string;
}

export interface PendingExpense {
  tempId: string;
  groupId: string;
  payload: CreateExpenseRequest;
  createdAt: string;
}

export interface SimpleShareDB {
  expenses: {
    key: string;
    value: ExpenseCacheEntry;
  };
  pending_expenses: {
    key: string;
    value: PendingExpense;
  };
  group_members: {
    key: string;
    value: GroupMember[];
  };
}
