export interface GroupOverview {
  id: string;
  name: string;
  myDebtSummary: MyDebtSummary;
  memberCount: number;
}

export interface MyDebtSummary {
  paidTotal: number;
  owedTotal: number;
  net: number;
  debtEdges: GroupDebtEdge[];
}

export interface GroupDebtEdge {
  otherMemberId: string;
  otherDisplayName: string;
  signedAmount: number;
  amount: number;
}
