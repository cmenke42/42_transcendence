import { Component, inject } from '@angular/core';
import { User } from '../../interface/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
    user : User = 
    {
      id: 0,
      email: "",
      password: "",
      is_superuser: false,
      otp: "",
    };
    show2fa : boolean = false;
    userService = inject(UserService);
    router = inject(Router);
    auth = inject(AuthService);
  
    constructor() {}
    // loginUser()
    // {
    //   this.userService.login(this.user).subscribe({
    //     next: (data: any) => {
    //       if (data.fa_pending)
    //         this.show2fa = true;
    //       else
    //       {
    //         this.JWT.storeJWTToken(data);
    //         const decodedToken = this.JWT.decodeToken(data.access);
    //         this.JWT.saveUserDetails(decodedToken);
    //         this.router.navigate(['/home']);
    //       }
    //     },
    //     error: err => {
    //       console.log("Error...", err);
    //       alert(err.error.message);
    //     }
    //   })
    // }

    loginUser()
    {
      this.auth.login(this.user).subscribe({
        next: (data: any) => {
          if (data.fa_pending)
            this.show2fa = true;
          else
            this.router.navigate(['/home']);
        },
        error: err => {
          console.log('Error...', err);
          alert(err.error.message);
        }
      })
    }

    verifyOTP()
    {
      const user = {email: this.user.email, otp: this.user.otp}
      this.auth.verifyOTP(this.user).subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.log('Error...', err);
          alert('OTP verification failed. Please try again. ' + err.error.message);
        }
      })
    }

    // verifyOTP()
    // {
    //   // const user = {email: this.user.email, otp: this.user.otp};
    //   this.userService.verifyOTP(this.user).subscribe
    //   ({
    //       next: () => 
    //       {
    //         this.router.navigate(['/home']);
    //       },
    //       error: (err) => 
    //       {
    //         console.log('Error...', err);
    //         alert('OTP verification failed. Please try again. ' + err.error.message);
    //       }
    //   })
    // }
    closePopup()
    {
      this.show2fa = false;
    }
}
