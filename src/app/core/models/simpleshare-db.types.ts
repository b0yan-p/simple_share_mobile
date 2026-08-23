import { CreateExpenseRequest } from 'src/app/features/expenses/models/create-expense.model';
import { ExpenseListItemDetails } from 'src/app/features/expenses/models/expense-list-item.model';
import { GroupMember } from 'src/app/features/groups/models/group-member.model';
import { GroupOverview } from 'src/app/features/groups/models/group-overview.model';
import { GroupListItem } from 'src/app/features/groups/models/group.model';

export interface ExpenseCacheEntry {
  items: ExpenseListItemDetails[];
  totalCount: number;
  cachedAt: string;
}

export interface GroupsCacheEntry {
  items: GroupListItem[];
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
  groups: {
    key: string;
    value: GroupsCacheEntry;
  };
  group_overview: {
    key: string;
    value: GroupOverview;
  };
}
