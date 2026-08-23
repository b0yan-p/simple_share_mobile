import { GroupListItem } from '../models/group.model';

/**
 * Fills in the client-derived `netBalanceMessage`. The message is not part of the
 * API response, so the cache stores raw items and this runs on every read —
 * the same split `mapExpenses` uses for the expense list.
 */
export function mapGroupListItems(items: GroupListItem[]): GroupListItem[] {
  return items.map((item) => ({
    ...item,
    netBalanceMessage:
      item.netBalance === 0
        ? 'Settled Up'
        : item.netBalance > 0
          ? `You are Owed BAM ${item.netBalance.toFixed(2)}`
          : `You Owe BAM ${Math.abs(item.netBalance).toFixed(2)}`,
  }));
}
