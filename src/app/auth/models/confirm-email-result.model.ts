export interface ConfirmEmailResult {
  confirmed: boolean;
  /** True when the link had already been used - still a success. */
  alreadyConfirmed: boolean;
}
