/**
 * The Add Expense page owns one of these; the payer and split screens are only
 * editors of it. Every amount is held in integer minor units so no rounding can
 * leak in between the screens.
 */

/** Which of the two allocations a screen is editing. */
export type AllocationKind = 'payers' | 'splits';

/**
 * `equal` keeps the selected members' amounts in sync with the expense total,
 * `custom` means the user typed amounts and we must never redistribute them.
 */
export type AllocationMode = 'equal' | 'custom';

export interface AllocationEntry {
  memberId: string;
  userId: string | null;
  displayName: string;
  selected: boolean;
  amountMinor: number;
}

export interface Allocation {
  mode: AllocationMode;
  /**
   * Set once the user commits a change from the editor screen. Explicit rather
   * than inferred from the amounts, so an edit that happens to reproduce the
   * default values is still treated as the user's own configuration.
   */
  modified: boolean;
  entries: AllocationEntry[];
}

export interface ExpenseDraft {
  /** Route identity of the expense being drafted — see `draftKey()`. */
  key: string;
  groupId: string;
  currency: string;
  description: string;
  expenseDate: string;
  totalMinor: number;
  payers: Allocation;
  splits: Allocation;
}

/**
 * Identifies the draft so a returning navigation reuses it while a different
 * expense (or a second new one) always starts clean.
 */
export function draftKey(
  groupId: string,
  params: { expenseId?: string; pendingId?: string },
): string {
  if (params.expenseId) return `${groupId}:expense:${params.expenseId}`;
  if (params.pendingId) return `${groupId}:pending:${params.pendingId}`;

  return `${groupId}:new`;
}

/** Route of the Add / Edit Expense page for these params. */
export function expensePath(
  groupId: string,
  params: { expenseId?: string; pendingId?: string },
): string[] {
  if (params.pendingId) return ['groups', groupId, 'expenses', 'pending', params.pendingId];
  if (params.expenseId) return ['groups', groupId, 'expenses', params.expenseId];

  return ['groups', groupId, 'expenses', 'new'];
}
