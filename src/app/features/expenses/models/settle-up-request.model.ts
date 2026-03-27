export interface SettleUpRequest {
  fromMemberId: string | null;
  toMemberId: string;
  amount: number;
  date: string;
}
