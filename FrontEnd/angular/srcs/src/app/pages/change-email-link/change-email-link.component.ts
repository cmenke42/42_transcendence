import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgFor, NgIf } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-change-email-link',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    TranslateModule,
  ],
  templateUrl: './change-email-link.component.html',
  styleUrl: './change-email-link.component.css'
})
export class ChangeEmailLinkComponent implements OnInit{
  message: string = '';
  success: boolean = false;
  isLoading: boolean = false;
  changeEmailLinkForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private translate: TranslateService,
  ) {
    this.changeEmailLinkForm = this.formBuilder.group({})
    const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
    this.translate.use(preferredLanguage);
    
  }

  ngOnInit(): void {
    this.changeEmailLinkForm = this.formBuilder.group(
      {
        email: ['', [Validators.required]],
        emailError: '',
      },
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
    return this.changeEmailLinkForm.get('email');
  }

  get emailError() {
    return this.changeEmailLinkForm.get('emailError');
  }

  private clearOldStatus() {
    this.success = false;
    this.message = '';
    this.emailError?.setValue('');
  }

  onSubmit() {
    this.changeEmailLinkForm.markAllAsTouched();
    if (this.changeEmailLinkForm.valid) {
      this.requestChangeEmailLink();
    }
  }

  requestChangeEmailLink() {
    this.isLoading = true;
    
    this.clearOldStatus();

    const email = this.changeEmailLinkForm.value.email;
    this.userService.requestChangeEmailLink({email})
      .pipe(
        tap((response) => {
          this.isLoading = false;
          this.success = true;
          this.message = response.status || 'A link to verify your email has been sent to your new email.';
        }),
        catchError(error => {
          this.isLoading = false;
          const fieldErrors = error.error;

          if (fieldErrors && fieldErrors.email) {
            this.emailError?.setValue(fieldErrors.email);
          }
          else {
            this.message = error.error?.status || this.translate.instant('SOMETHING_WENT_WRONG');
          }
          return of(error);
        }),
      )
      .subscribe();
  }
}
