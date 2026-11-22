import { GroupType } from './group-type.model';
export interface GroupOverview {
  type?: GroupType;
  coverImageKey?: string | null;
  currency: string;
  id: string;
  name: string;
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
