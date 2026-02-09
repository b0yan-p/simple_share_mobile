export interface Activity {
  id: string;
  createdAt: string;
  type: ActivityType;
  groupId: string;
  groupName: string | null;
  actorMemberId: string | null;
  actorName: string;
  entityType: ActivityEntityType;
  entityId: string;
  data:
    | ActivityExpenseData
    | ActivityExpenseUpdateData
    | ActivitySettleUpData
    | ActivityMemberData;
}

export enum ActivityType {
  ExpenseCreated = 10,
  ExpenseUpdated = 11,
  ExpenseDeleted = 12,
  SettleUpCreated = 20,
  MemberAddedToGroup = 30,
  MemberRemovedFromGroup = 31,
}

export enum ActivityEntityType {
  Expense = 10,
  SettleUp = 20,
  Member = 30,
}

export interface ActivityExpenseData {
  description: string;
  amount: number;
  changedFields: string[] | null;
}

export interface ActivityExpenseUpdateData {
  descriptionBefore: string;
  descriptionAfter: string;
  amountBefore: string;
  amountAfter: string;
  changedFields: string[];
}

export interface ActivitySettleUpData {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export interface ActivityMemberData {
  TargetMemberId: string;
  TargetMemberName: string;
}
