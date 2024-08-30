import { Component, inject, OnInit } from '@angular/core';
import { User } from '../../interface/user';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PopupMessageService } from '../../service/popup-message.service';
import { passwordMatchValidator } from '../../helper/password-match-validator.directive';
import { catchError, of, tap } from 'rxjs';
import { NgClass, NgFor, NgIf } from '@angular/common';

const defaultSuccessMessage = 'Successfully added Player\n please check your email to verify...!';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    NgClass,
    NgFor,
    NgIf,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit {
  user: User;
  userService = inject(UserService);

  //for Form
  message: string = "";
  success: boolean = false;
  isLoading: boolean = false;
  signupForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private translate: TranslateService,
    private popupMessageService: PopupMessageService,
    private formBuilder: FormBuilder,
  ) {
    this.user = {
      id: 0,
      email: '',
      password: '',
      is_superuser: false,
      otp: '',
      is_intra_user: false,
      is_active: false,
    };
    this.translate.use(localStorage.getItem('preferredLanguage') ?? 'en');
    this.signupForm = this.formBuilder.group({});
  }

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group(
      {
        email: ['', [Validators.required, Validators.email]],
        emailError: "",
        password: ['', [Validators.required]],
        passwordError: "",
        confirm_password: ['', [Validators.required]],
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
      case 'email':
        return 'This email is not valid';
      default:
        return 'Invalid input.';
    }
  }

  get email(): AbstractControl {
    return this.signupForm.get('email')!;
  }

  get emailError(): AbstractControl {
    return this.signupForm.get('emailError')!;
  }

  get password(): AbstractControl {
    return this.signupForm.get('password')!;
  }

  get passwordError(): AbstractControl {
    return this.signupForm.get('passwordError')!;
  }

  get confirm_password(): AbstractControl {
    return this.signupForm.get('confirm_password')!;
  }

  private clearOldStatus() {
    this.success = false;
    this.message = "";
    this.emailError.setValue('');
    this.passwordError.setValue('');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.signupForm.markAllAsTouched();
    if (this.signupForm.valid) {
      this.user.email = this.email.value;
      this.user.password = this.password.value;
      this.registerUser();
    }
  }

  registerUser() {
    this.isLoading = true;

    this.clearOldStatus();

    this.userService.registerUser(this.user)
      .pipe(
        tap((response) => {
          this.isLoading = false;
          this.success = true;
          this.popupMessageService.showMessage(defaultSuccessMessage, 'success');
          // this.message = response.status || defaultSuccessMessage;
        }),
        catchError((error) => {
          this.isLoading = false;
          const fieldErrors = error.error;

          if (fieldErrors) {
            this.emailError.setValue(fieldErrors?.email);
            this.passwordError.setValue(fieldErrors?.password);
          }
          else {
            const statusError = error.error?.status;
            const nonFieldError = error.error?.non_field_errors;
            const defaultMessage = this.translate.instant('SOMETHING_WENT_WRONG');

            this.message = [statusError, nonFieldError].filter(Boolean).join('\n') || defaultMessage;
          }
          return of(error);
        }),
      )
      .subscribe();
  }
}
