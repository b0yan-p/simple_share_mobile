/**
 * Registration no longer signs the user in - the account stays unusable until
 * the address is confirmed, so there is no token to store.
 */
export interface RegisterResult {
  email: string;
  emailVerificationRequired: boolean;
}
