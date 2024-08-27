import { AbstractControl, ValidationErrors, ValidatorFn } from  "@angular/forms"

export const passwordMatchValidator: ValidatorFn = (
    control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirm_password');

  if (password && confirmPassword
      && password.value !== confirmPassword.value
  ) {
      return { passwordMatchError: true };
  }
  return null;
}
