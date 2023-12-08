import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function createPasswordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]+/.test(value);
    const hasLowerCase = /[a-z]+/.test(value);
    const hasNumeric = /[0-9]+/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

    return !passwordValid ? { passwordStrength: true } : null;
  };
}

// custom validator to check that two fields match
export function passwordMatchValidator(controlName: string, matchingControlName: string) {
    return (group: AbstractControl) => {
        const control = group.get(controlName);
        const matchingControl = group.get(matchingControlName);

        if (!control || !matchingControl) {
            return null;
        }

        // set error on matchingControl if validation fails
        if (control.value !== matchingControl.value) {
            matchingControl.setErrors({ mustMatch: true });
        } else {
            matchingControl.setErrors(null);
        }
        return null;
    };
}

export function dobFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const dobPattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
  
      if (!control.value || !dobPattern.test(control.value)) {
        return { dobFormat: true };
      }
  
      return null;
    };
  }

  export function mobileNumberValidator(countryCode: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const mobileNumberPattern = new RegExp(`^\\${countryCode}\\d{10}$`);
  
      if (!control.value || !mobileNumberPattern.test(control.value)) {
        return { mobileNumberFormat: true };
      }
  
      return null;
    };
  }