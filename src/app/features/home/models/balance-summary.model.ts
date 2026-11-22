export interface CurrencyBalance {
  currency: string;
  owedToMeTotal: number;
  iOweTotal: number;
  net: number;
  groupCount: number;
}
export interface BalanceSummary {
  groupCount: number;
  balances: CurrencyBalance[];
}
