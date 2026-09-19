export const CURRENCY = 'BAM';
export const AMOUNT_MIN = 0.01;
// Max amount of money you can enter in the expense form.
export const AMOUNT_MAX = 100000;
// Mirrors [MaxLength(200)] on the backend CreateExpenseRequest.Description.
export const DESCRIPTION_MAX_LENGTH = 200;

/**
 * Minor-unit precision per currency. Money is calculated in integer minor units
 * everywhere, so this is the single place that knows how many of them make one
 * major unit.
 */
export const CURRENCY_DECIMALS: Readonly<Record<string, number>> = { BAM: 2 };
export const DEFAULT_CURRENCY_DECIMALS = 2;
