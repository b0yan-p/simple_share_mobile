import { AMOUNT_TOLERANCE } from './expense.constants';

/**
 * Divides a total amount into `count` equal parts.
 * The last element absorbs any rounding difference.
 */
export function splitEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor((total / count) * 100) / 100;
  const remainder = Math.round((total - base * count) * 100) / 100;
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? base + remainder : base,
  );
}

/**
 * Returns the sum of amounts for all selected entries.
 */
export function sumSelectedAmounts(
  entries: { selected: boolean; amount: number }[],
): number {
  return entries.filter((e) => e.selected).reduce((sum, e) => sum + (e.amount || 0), 0);
}

/**
 * Returns true if two amounts are equal within the allowed rounding tolerance.
 */
export function amountsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < AMOUNT_TOLERANCE;
}
