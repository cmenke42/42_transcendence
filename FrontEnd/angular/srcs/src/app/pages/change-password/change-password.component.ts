import { Component, OnInit } from '@angular/core';
import { IChangePassword } from './change-password.interface';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { passwordMatchValidator } from '../../helper/password-match-validator.directive';
import { tap, catchError, of } from 'rxjs';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgFor,
    NgIf,
    TranslateModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {
  message: string = "";
  success: boolean = false;
  isLoading: boolean = false;
  payload: IChangePassword;
  changePasswordForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private translate: TranslateService
  ) {
    this.changePasswordForm = this.formBuilder.group({});
    this.payload = {
      old_password: '',
      new_password: '',
    };
  }

  ngOnInit(): void {
    this.changePasswordForm = this.formBuilder.group(
      {
        old_password: ['', [Validators.required]],
        old_passwordError: '',
        password: ['', [Validators.required]],
        passwordError: '',
        confirm_password: ['', [Validators.required]]
      },
      {
        validators: passwordMatchValidator,
      }
    );
  }

  getErrorMessage(control: AbstractControl, validator: string): string {
    switch (validator) {
      case 'required':
        return 'This field is required.';
      case 'passwordMatchError':
        return 'Passwords do not match.';
      default:
        return 'Invalid input.';
    }
  }

  get old_password(): AbstractControl {
    return this.changePasswordForm.get('old_password')!;
  }

  get old_passwordError(): AbstractControl {
    return this.changePasswordForm.get('old_passwordError')!;
  }

  get password(): AbstractControl {
    return this.changePasswordForm.get('password')!;
  }

  get passwordError(): AbstractControl {
    return this.changePasswordForm.get('passwordError')!;
  }

  get confirm_password(): AbstractControl {
    return this.changePasswordForm.get('confirm_password')!;
  }
  
  private clearOldStatus() {
    this.success = false;
    this.message = "";
    this.old_passwordError.setValue('');
    this.passwordError.setValue('');
  }

  onSubmit() {
    this.changePasswordForm.markAllAsTouched();
    if (this.changePasswordForm.valid) {
      this.payload.old_password = this.old_password.value;
      this.payload.new_password = this.password.value;
      this.changePassword();
    }
  }

  changePassword() {
    this.isLoading = true;

    this.clearOldStatus();

    this.userService.changePassword(this.payload)
      .pipe(
        tap((response) => {
          this.isLoading = false;
          this.success = true;
          this.message = response.status || 'Password changed successfully!';
        }),
        catchError(error => {
          this.isLoading = false;
          const fieldErrors = error.error;
          
          if (fieldErrors)
            {
              if (fieldErrors.old_password) {
                this.old_passwordError.setValue(fieldErrors.old_password);
              }
              if (fieldErrors.new_password) {
                this.passwordError.setValue(fieldErrors.new_password);
              }
            }
          else
          {
            this.message = error.error.status || error.error.non_field_errors ||
              'Something went wrong. Please try again later.';
          }
          return of(error);
        }),
      )
      .subscribe();
  }
}
