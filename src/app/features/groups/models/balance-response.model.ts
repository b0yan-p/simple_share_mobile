export interface MemberBalance {
  memberId: string;
  displayName: string;
  paid: number;
  owed: number;
  net: number;
}

export interface DebtEdge {
  debtorMemberId: string;
  debtorDisplayName: string;
  creditorMemberId: string;
  creditorDisplayName: string;
  amount: number;
}

export interface BalanceResponse {
  groupId: string;
  currentMemberId: string;
  members: MemberBalance[];
  debts: DebtEdge[];
}
