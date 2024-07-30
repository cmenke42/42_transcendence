import { Component, OnInit } from '@angular/core';
import { IResetPassword } from './reset-password.interface';
import { UserService } from '../../service/user.service';
import { ActivatedRoute } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule,Validators } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { passwordMatchValidator } from '../../helper/password-match-validator.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    NgClass,
    TranslateModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  message: string = "";
  success: boolean = false;
  isLoading: boolean = false;
  passwordResetForm: FormGroup;
  payload: IResetPassword;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {
    this.passwordResetForm = this.formBuilder.group({});
    this.payload = {
      user_id_b64: "",
      token: "",
      new_password: "",
    };

    const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
    this.translate.use(preferredLanguage);
  }

  ngOnInit(): void {
    const user_id_b64 = this.route.snapshot.paramMap.get('user_id_b64');
    const token = this.route.snapshot.paramMap.get('token');
    
    if (user_id_b64 && token) {
      this.payload.user_id_b64 = user_id_b64;
      this.payload.token = token;
    }

    this.passwordResetForm = this.formBuilder.group(
      {
        password: ['', [Validators.required]],
        passwordError: '',
        confirm_password: ['', [Validators.required]],
      },
      {
        validators: passwordMatchValidator,
      }
    )
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

  // getters for form fields
  get password() { 
    return this.passwordResetForm.get('password'); 
  }
  get confirm_password() { 
    return this.passwordResetForm.get('confirm_password'); 
  }

  get passwordError() { 
    return this.passwordResetForm.get('passwordError'); 
  }

  private clearOldStatus() {
    this.success = false;
    this.message = '';
    this.passwordError?.setValue('');
  }

  onSubmit() {
    this.passwordResetForm.markAllAsTouched();
    if (this.passwordResetForm.valid) {
      this.payload.new_password = this.password?.value;
      this.resetPassword();
    }
  }

  resetPassword() {
    this.isLoading = true;

    this.clearOldStatus();

    this.userService.resetPassword(this.payload)
      .pipe(
        tap((response) => {
          this.isLoading = false;
          this.success = true;
          this.message = response.status || 'Password reset successfully!';
        }),
        catchError(error => {
          this.isLoading = false;
          const fieldErrors = error.error;

          if (fieldErrors && fieldErrors.new_password) {
            console.log(fieldErrors.new_password)
              this.passwordError?.setValue(fieldErrors.new_password);
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
