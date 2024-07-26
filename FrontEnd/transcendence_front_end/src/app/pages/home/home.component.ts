import { Component, OnDestroy, OnInit, inject} from '@angular/core';
import { UserService } from '../../service/user.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '../../interface/user';
import { UserProfile } from '../../interface/user-profile';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ChangeDetectorRef } from '@angular/core';
import { UserComponent } from '../user/user.component';



@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        RouterOutlet,
        NgbDropdownModule,
        FormsModule,
        UserComponent
    ]
})
export class HomeComponent implements OnInit, OnDestroy {

  loggedInUser: any;
  user_profile: UserProfile | null = null;
  warning : string = '';
  newNickname: string = '';
  newAvatar: File | null = null;
  data: User[] = []; 
  private tokenRefreshSubScription?: Subscription;

  isEditing: boolean = false;

  private userService = inject(UserService);
  router = inject(Router);
  private auth = inject(AuthService);
  
  ngOnInit() 
  {
    this.loggedInUser = this.userService.getLoggedInUser();
    console.log("Home component is loaded...", this.loggedInUser);
    if (this.loggedInUser?.is_superuser)
      this.getUser();
    else if (this.loggedInUser?.id && !this.loggedInUser?.is_superuser)
    {
      this.getProfile();
      // this.getSpecificUser(this.loggedInUser.id); // do we need this?
    }
  }
  
  constructor(private cdr: ChangeDetectorRef) {}
  ngOnDestroy(): void {
  //   if (this.tokenRefreshSubScription)
  //     this.tokenRefreshSubScription.unsubscribe();
  }

  toggleEdit()
  {
    this.isEditing = !this.isEditing;
    if (!this.isEditing)
    {
      this.newNickname = this.user_profile?.nickname || '';
    }
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

  toggleUserActivation(user_id: number, action: string)
  {
    if(action != 'activate' && action != 'deactivate')
    {
      console.log("Invalid action...");
      return;
    }
    else if(action == 'deactivate' && this.loggedInUser?.id == user_id && this.loggedInUser?.is_superuser)
      alert('Admin cannot deactivate himself');
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


  getProfile()
  {
    console.log("testing", this.auth.isLoggedIn);
    if (this.loggedInUser?.id)
    {
      this.userService.showProfile(this.loggedInUser?.id).subscribe({
        next: (data) => {
          console.log("Data for profile is...", data);
          this.user_profile = data;
          if (this.user_profile) {
          }
          if (this.user_profile?.nickname === ('nickname-' + this.user_profile?.user_id))
          {
            // alert('Please update your profile e.g nickname');
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
          this.cdr.detectChanges();
          this.newNickname = '';
          this.newAvatar = null;
          this.getProfile();
          this.isEditing = false; // Exit edit mode
          console.log('Profile updated successfully');
        },
        error: (err) => {
          alert('Oops!\nYour avatar must be:\n -2MB max\n -800x800 max\n -Be a .jpg, .jpeg or .png file.');
          console.error('Error updating profile', err);
        }
      });
    }
  }


  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ON': 'Online',
      'OF': 'Offline',
      'IA': 'Inactive',
      'GA': 'Playing'
    };
    return statusMap[status] || 'Unknown';
  }

}
