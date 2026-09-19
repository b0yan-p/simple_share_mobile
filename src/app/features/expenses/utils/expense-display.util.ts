import { Allocation, AllocationEntry } from '../models/expense-draft.model';

/**
 * Every user-facing string of the Add Expense summary lives here, so the screen
 * templates stay free of string conditions and there is a single seam to hand to
 * an i18n library later. Each sentence is produced whole (never assembled from
 * translated fragments) so word order and plurals stay translatable.
 */

export interface RowDisplay {
  /** Value shown on the right of the row. */
  primary: string;
  /** Optional qualifier under the primary value. */
  secondary: string | null;
}

/** Selected entries — the members taking part in this allocation. */
export function participants(allocation: Allocation): AllocationEntry[] {
  return allocation.entries.filter((entry) => entry.selected);
}

/** Selected entries that actually carry money. A payer of 0.00 has not paid. */
export function contributors(allocation: Allocation): AllocationEntry[] {
  return allocation.entries.filter((entry) => entry.selected && entry.amountMinor > 0);
}

/** True when every member of the group takes part. */
export function includesEveryone(allocation: Allocation): boolean {
  return allocation.entries.length > 0 && allocation.entries.every((entry) => entry.selected);
}

/**
 * True when the contributing amounts are not all the same. An equal split with a
 * remainder (3.34 / 3.33 / 3.33) is deliberately not "different" — the one minor
 * unit of rounding is noise, not a decision the user made.
 */
export function hasDifferentAmounts(allocation: Allocation): boolean {
  const amounts = contributors(allocation).map((entry) => entry.amountMinor);

  if (amounts.length < 2) return false;

  return Math.max(...amounts) - Math.min(...amounts) > 1;
}

// ─── Paid by row ─────────────────────────────────────────────────────────────

export function payerRowDisplay(payers: Allocation, currentUserId: string | null): RowDisplay {
  const paying = contributors(payers);

  if (!paying.length) return { primary: 'Not set', secondary: null };

  if (paying.length === 1) {
    const [payer] = paying;

    return {
      primary: isCurrentUser(payer, currentUserId) ? 'You' : payer.displayName,
      secondary: null,
    };
  }

  const secondary = hasDifferentAmounts(payers) ? 'Different amounts' : null;
  const others = paying.filter((payer) => !isCurrentUser(payer, currentUserId)).length;

  if (others < paying.length) {
    return {
      primary: others === 1 ? 'You + 1 other' : `You + ${others} others`,
      secondary,
    };
  }

  return { primary: `${paying.length} people`, secondary };
}

// ─── Split between row ───────────────────────────────────────────────────────

export function splitRowDisplay(splits: Allocation): RowDisplay {
  const taking = participants(splits);

  if (!taking.length) return { primary: 'Not set', secondary: null };

  const everyone = includesEveryone(splits);

  if (splits.mode === 'equal') {
    if (everyone) return { primary: 'Everyone equally', secondary: null };

    return {
      primary: taking.length === 1 ? '1 member' : `${taking.length} members equally`,
      secondary: null,
    };
  }

  return {
    primary: everyone ? `All ${taking.length} members` : `${taking.length} members`,
    secondary: hasDifferentAmounts(splits) ? 'Different amounts' : null,
  };
}

// ─── Summary sentence ────────────────────────────────────────────────────────

export function payerPhrase(payers: Allocation, currentUserId: string | null): string | null {
  const paying = contributors(payers);

  if (!paying.length) return null;

  if (paying.length === 1) {
    const [payer] = paying;

    return isCurrentUser(payer, currentUserId) ? 'Paid by you' : `Paid by ${payer.displayName}`;
  }

  return `${paying.length} people paid`;
}

export function splitPhrase(splits: Allocation): string | null {
  const taking = participants(splits);

  if (!taking.length) return null;

  const everyone = includesEveryone(splits);

  if (splits.mode === 'equal') {
    return everyone
      ? `Split equally between all ${taking.length} members`
      : `Split equally between ${taking.length} members`;
  }

  return everyone
    ? `Custom split between all ${taking.length} members`
    : `Custom split between ${taking.length} members`;
}

/** `{payer phrase} · {split phrase}`, skipping either half when it is unknown. */
export function summarySentence(
  payers: Allocation,
  splits: Allocation,
  currentUserId: string | null,
): string {
  return [payerPhrase(payers, currentUserId), splitPhrase(splits)]
    .filter((phrase): phrase is string => phrase !== null)
    .join(' · ');
}

function isCurrentUser(entry: AllocationEntry, currentUserId: string | null): boolean {
  return currentUserId !== null && entry.userId === currentUserId;
}
