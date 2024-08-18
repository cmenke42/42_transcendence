import { Component, OnInit, inject } from '@angular/core';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { UserProfile } from '../../interface/user-profile';
import { ProfileUpdateService } from '../../service/ProfileUpdateService';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PopupMessageService } from '../../service/popup-message.service';
import { User } from '../../interface/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-update-user',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './update-user.component.html',
  styleUrl: './update-user.component.css'
})
export class UpdateUserComponent implements OnInit {

  private userService = inject(UserService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private profileUpdateService = inject(ProfileUpdateService);
  private translate = inject(TranslateService);
  private popupMessageService = inject(PopupMessageService);

  user_profile: UserProfile | null = null;
  loggedInUser: any;
  warning : string = '';
  newNickname: string = '';
  newAvatar: File | null = null;
  isEditing: boolean = false;
  data: User[] = []; 

  ngOnInit(): void 
  {
    this.loggedInUser = this.userService.getLoggedInUser();
    console.log("Update User component is loaded...", this.loggedInUser);
    if (this.loggedInUser?.id && this.loggedInUser?.is_intra_user)
      this.getProfile();
  }

  getUser()
  { 
    this.userService.getUserData().subscribe({
      next: (data: User[]) => {
        this.data = data;
        
        console.log("Data is from getUser function...", data);
      },
      error: err => {
        console.log("Error...", err);
      }
    })
  }


  getProfile()
  {
    console.log("testing", this.auth.isLoggedIn);
    if (this.loggedInUser?.id)
    {
      this.userService.showProfile(this.loggedInUser?.id).subscribe({
        next: (data) => {
          console.log("Data for profile is...", data);
          this.user_profile = data;
          // if (this.user_profile) {
          // }
          if (this.user_profile?.nickname === ('nickname-' + this.user_profile?.user_id))
          {
            this.warning = 'Please update your profile e.g nickname'; 
          }
        },
        error: err => {
          console.log("Error...", err);
        }
      })
    }
  }

  onFileSelected(event: any) {
    this.newAvatar = event.target.files[0];
  }

  saveProfileChanges() {
    if (this.user_profile) {
      const formData = new FormData();
      formData.append('nickname', this.newNickname);
      if (this.newAvatar) {
        formData.append('avatar', this.newAvatar, this.newAvatar.name);
      }

      this.userService.updateProfile(this.user_profile.user_id, formData).subscribe({
        next: (updatedProfile) => {
          this.user_profile = updatedProfile;
          this.profileUpdateService.updateProfile(updatedProfile);
          this.newNickname = '';
          this.newAvatar = null;

          this.getProfile();
          this.isEditing = false; // Exit edit mode
          console.log('Profile updated successfully');
        },
        error: (err) => {
          if(err.error == "BAD REQUEST")
            this.popupMessageService.showMessage(`Oops!\nYour avatar must be:\n 
																									-2MB max\n -800x800 max\n 
																									-Be a .jpg, .jpeg or .png file.`,
																									 'error');
          else
             this.popupMessageService.showMessage(`Oops!\n
																									Something went wrong during update. Please try again.`,
																						 			'error');
          console.error('Error updating profile', err);
        }
      });
    }
  }

  toggleUserActivation(user_id: number, action: string)
  {
    if(action != 'activate' && action != 'deactivate')
    {
      console.log("Invalid action...");
      return;
    }
    else if(action == 'deactivate' && this.loggedInUser?.id == user_id && this.loggedInUser?.is_superuser)
      this.popupMessageService.showMessage('Admin cannot deactivate himself', 'error');
    else if(confirm('Are you sure you want to ' + action + ' this user?'))
      this.userService.toggleUserActivation(user_id, action).subscribe({
        next: data => {
          this.getUser();
          if (action == 'deactivate' && !(this.loggedInUser?.is_superuser))
            this.auth.logout();
        },
        error: err => {
          console.log("Error...", err);
        }
      })
  }

}
