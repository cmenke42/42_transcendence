import { Component, inject } from '@angular/core';
import { User } from '../../user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserService } from '../../service/user.service';

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
    user : User = {
      user_id: 0,
      email: "",
      password: "",
      is_superuser: false,
    };
    userService = inject(UserService);
    router = inject(Router);
    constructor() {}
    loginUser()
    {
      this.userService.login(this.user).subscribe({
        next: data => {
          this.router.navigate(['/home']);
        },
        error: err => {
          console.log("Error...", err);
          alert(err.error.message);
        }
      })
    }

}
