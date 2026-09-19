import { CURRENCY, CURRENCY_DECIMALS, DEFAULT_CURRENCY_DECIMALS } from './expense.constants';

/** Number of decimals a currency is quoted in (2 for BAM). */
export function currencyDecimals(currency: string = CURRENCY): number {
  return CURRENCY_DECIMALS[currency] ?? DEFAULT_CURRENCY_DECIMALS;
}

/** 10 ^ decimals — how many minor units make one major unit. */
export function minorFactor(currency: string = CURRENCY): number {
  return 10 ** currencyDecimals(currency);
}

/**
 * Converts a user-entered major-unit amount into integer minor units.
 *
 * `toFixed` before rounding because binary floating point turns 24.005 * 100
 * into 2400.4999999999995, which would silently round a cent away.
 */
export function toMinor(
  amount: number | null | undefined,
  currency: string = CURRENCY,
): number {
  if (amount == null || !Number.isFinite(amount)) return 0;

  return Math.round(Number((amount * minorFactor(currency)).toFixed(6)));
}

/** Converts integer minor units back to a major-unit number for display. */
export function fromMinor(minor: number, currency: string = CURRENCY): number {
  return minor / minorFactor(currency);
}

/**
 * Divides a total into `count` parts that always sum back to exactly the total.
 *
 * The remainder minor units are handed out one each to the first participants,
 * which is deterministic and keeps 10.00 / 3 at 3.34 + 3.33 + 3.33 rather than
 * producing a 9.99 or 10.01 total.
 */
export function splitEquallyMinor(totalMinor: number, count: number): number[] {
  if (count <= 0) return [];

  const sign = totalMinor < 0 ? -1 : 1;
  const absolute = Math.abs(totalMinor);
  const base = Math.floor(absolute / count);
  const remainder = absolute - base * count;

  return Array.from({ length: count }, (_, i) => sign * (base + (i < remainder ? 1 : 0)));
}

/** Sum of integer minor-unit amounts. Exact — no floating point involved. */
export function sumMinor(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}
