import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../service/user.service';
import { catchError, tap } from 'rxjs';
import { of } from 'rxjs';
import { IActivateAccount } from './activate-account.interface';
import { RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';



@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [
    RouterModule,
    NgClass,
  ],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css'
})
export class ActivateAccountComponent implements OnInit {
  private payload: IActivateAccount;
  isLoading: boolean = false;
  success: boolean = false;
  message: string = "";


  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {
    this.payload = {
      user_id_b64: "",
      token: ""
    };
  }
  
  ngOnInit(): void {
    const user_id_b64 = this.route.snapshot.paramMap.get('user_id_b64');
    const token = this.route.snapshot.paramMap.get('token');
    
    if (user_id_b64 && token) {
      this.payload = {
        user_id_b64: user_id_b64,
        token: token
      }
    }
    this.activateAccount();
  }

  activateAccount(): void {
    this.isLoading = true;
    this.userService.activateAccount(this.payload).pipe(
      tap( response => {
        this.isLoading = false;
        this.success = true;
        this.message = "Your account has been activated successfully";
      }),
      catchError( error => {
        this.isLoading = false;
        this.message = error.error.status || error.error.non_field_errors ||
        'Something went wrong. Please try again later.';
        console.log(error);
        return of (error);
      })
    ).subscribe();
  }
}
