import { Component, inject } from '@angular/core';

import { User } from '../../user';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
	FormsModule,
	RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {

	user : User = {
		user_id : 0,
		email : '',
		password: '',
		is_superuser: false,
	};
	userService = inject(UserService);
	constructor()
	{}

	//function to confirm password with password
	confirmPassword : string = '';
	userRegisteration()
	{
		if (this.user.email === '' || this.user.password === '')
			alert('Please fill all the fields...');
		else if (this.user.password !== this.confirmPassword)
			alert('Password and Confirm Password should be same...');
		else
		{
			this.userService.registerUser(this.user).subscribe(
				{
					next : response => {
						console.log('successfull: ', response);
						alert('Successfull added Player\n please check your email to verify...');
					},
					error: error => {
						console.error('Error...', error);
						alert(error);
					}
				}
			)
		}
	}
}
