import type { ValidatorFn } from '@angular/forms';

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
export const PASSWORD_HINT =
  'At least 6 characters, with an uppercase letter, a lowercase letter and a number.';

export function passwordsMatch(passwordField: string): ValidatorFn {
  return (group) => {
    const repeat = group.get('repeatPassword')?.value;
    return !repeat || repeat === group.get(passwordField)?.value
      ? null
      : { passwordsMismatch: true };
  };
}
