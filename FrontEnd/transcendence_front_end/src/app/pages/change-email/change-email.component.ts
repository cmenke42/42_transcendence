import { Component, OnInit } from '@angular/core';
import { IChangeEmail } from './change-email.interface';
import { UserService } from '../../service/user.service';
import { ActivatedRoute } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-change-email',
  standalone: true,
  imports: [
    NgClass,
  ],
  templateUrl: './change-email.component.html',
  styleUrl: './change-email.component.css'
})
export class ChangeEmailComponent implements OnInit {
  message: string = "";
  success: boolean = false;
  isLoading: boolean = false;
  payload: IChangeEmail;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
  ) {
    this.payload = {
      user_id_b64: "",
      email_b64: "",
      token: "",
    };
  }

  ngOnInit(): void {
    const user_id_b64 = this.route.snapshot.paramMap.get('user_id_b64');
    const email_b64 = this.route.snapshot.paramMap.get('email_b64');
    const token = this.route.snapshot.paramMap.get('token');

    if (user_id_b64 && email_b64 && token) {
      this.payload = {
        user_id_b64: user_id_b64,
        email_b64: email_b64,
        token: token,
      };
    }
    this.changeEmail();
  }

  changeEmail() {
    this.isLoading = true;
    this.userService.changeEmail(this.payload)
    .pipe(
      tap((response) => {
        this.isLoading = false;
        this.success = true;
        this.message = response.status || 'Email changed successfully.';
      }),
      catchError((error) => {
        this.isLoading = false;
        this.message = error.error.status || error.error.non_field_errors ||
          'Something went wrong. Please try again later.';
        return of(error);
      }),
    )
    .subscribe();
  }
}
