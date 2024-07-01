import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { tap, catchError } from 'rxjs/operators';
import { NgFor, NgIf } from '@angular/common';
import { of } from 'rxjs';

@Component({
  selector: 'app-reset-password-link',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
  ],
  templateUrl: './reset-password-link.component.html',
  styleUrl: './reset-password-link.component.css'
})
export class ResetPasswordLinkComponent implements OnInit {
  message: string = '';
  success: boolean = false;
  isLoading: boolean = false;
  passwordResetLinkForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
  ) {
    this.passwordResetLinkForm = this.formBuilder.group({});
  }

  ngOnInit(): void {
    this.passwordResetLinkForm = this.formBuilder.group(
      {
        email: ['', [Validators.required]],
        emailError: '',
      }
    );
  }

  getErrorMessage(control: AbstractControl, validator: string): string {
    switch (validator) {
      case 'required':
        return 'This field is required.';
      default:
        return 'Invalid input.';
    }
  }

  get email() {
    return this.passwordResetLinkForm.get('email');
  }

  get emailError() {
    return this.passwordResetLinkForm.get('emailError');
  }

  private clearOldStatus() {
    this.success = false;
    this.message = '';
    this.emailError?.setValue('');
  }

  onSubmit() {
    this.passwordResetLinkForm.markAllAsTouched();
    if (this.passwordResetLinkForm.valid) {
      this.requestPasswordResetLink();
    }
  }

  requestPasswordResetLink() {
    this.isLoading = true;
    
    this.clearOldStatus();

    const email = this.passwordResetLinkForm.value.email;
    this.userService.requestPasswordResetLink({ email })
      .pipe(
        tap((response) => {
          this.isLoading = false;
          this.success = true;
          this.message = response.status || 'Password reset link has been sent successfully!';
        }),
        catchError(error => {
          this.isLoading = false;
          const fieldErrors = error.error;

          if (fieldErrors && fieldErrors.email) {
            this.emailError?.setValue(fieldErrors.email);
          }
          else {
            this.message = error.error.status || 'Something went wrong. Please try again later.';
          }
          return of(error);
        }),
      )
      .subscribe();
  }
}
