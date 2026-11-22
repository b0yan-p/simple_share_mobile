export interface GroupOverview {
  currency: string;
  id: string;
  name: string;
  coverImageUrl?: string | null;
  myDebtSummary: MyDebtSummary;
  memberCount: number;
  currentMemberId: string;
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
