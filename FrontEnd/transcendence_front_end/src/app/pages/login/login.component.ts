import { Component, inject } from '@angular/core';
import { User } from '../../interface/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';
import { AuthService } from '../../service/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PopupMessageService } from '../../service/popup-message.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
    user : User = 
    {
      id: 0,
      email: "",
      password: "",
      is_superuser: false,
      otp: "",
      is_intra_user: false,
      is_active: false,
    };
    show2fa : boolean = false;
    userService = inject(UserService);
    router = inject(Router);
    auth = inject(AuthService);

    showPassword: boolean = false;

    constructor ( private translate: TranslateService, private popupMessageService: PopupMessageService ) {
      this.translate.use(localStorage.getItem('preferredLanguage') ?? 'en');
    }
    
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
          if(err.status == 401)
            this.popupMessageService.showMessage('Invalid credentials. Please try again', 'error');
          else
            this.popupMessageService.showMessage(err.message, 'error');
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
          this.popupMessageService.showMessage('OTP verification failed. Please try again. ' + err.message, 'error');
        }
      })
    }  

    // 42 Intra Authentification
    loginOAuth() {
        window.location.href = 'https://localhost:6010/api/v1/oauth_login/';
    }

    loginGoogleOAuth() {
      window.location.href = 'https://localhost:6010/api/v1/oauth_google_login/';
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



    togglePassword() {
      this.showPassword = !this.showPassword;
    }
}
