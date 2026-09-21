/** The current user's standing across every group, as returned by GET /balance/me. */
export interface BalanceSummary {
  owedToMeTotal: number;
  iOweTotal: number;
  net: number;
  /** Groups where the user still has an open debt - not the count of all their groups. */
  groupCount: number;
}
