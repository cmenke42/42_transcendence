import { Component, inject } from '@angular/core';
import { User } from '../../interface/user';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PopupMessageService } from '../../service/popup-message.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
	FormsModule,
	RouterOutlet,
    RouterLink,
    RouterLinkActive,
	TranslateModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {

	user : User = {
		id : 0,
		email : '',
		password: '',
		is_superuser: false,
		otp: '',
		is_intra_user: false,
		is_active: false,
	};
	userService = inject(UserService);
	constructor( private translate: TranslateService, private popupMessageService: PopupMessageService ) {
		this.translate.use(localStorage.getItem('preferredLanguage') ?? 'en');
	}

	//function to confirm password with password
	confirmPassword : string = '';
	userRegisteration()
	{
		if (this.user.email === '' || this.user.password === '')
			this.popupMessageService.showMessage('Please fill all the fields...', 'error');
		else if (this.user.password !== this.confirmPassword)
			this.popupMessageService.showMessage('Password and Confirm Password should be same...', 'error');
		{
			this.userService.registerUser(this.user).subscribe(
				{
					next : response => {
						console.log('successfull: ', response);
						this.popupMessageService.showMessage('Successfull added Player\n please check your email to verify...!', 'success');
					},
					error: error => {
						console.error('Error...', error);
						let errorMessage = 'An unexpected error occurred';
						if (error.error) {
							const errorMessages = [];
							for (const key in error.error) {
								if (Array.isArray(error.error[key])) {
									errorMessages.push(...error.error[key]);
								}
							}
							if (errorMessages.length > 0) {
								errorMessage = errorMessages.join('<br>');
							}
						}
						this.popupMessageService.showMessage(errorMessage, 'error');
					}
				}
			)
		}
	}
}
