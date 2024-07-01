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
    ]
})
export class HomeComponent implements OnInit, OnDestroy {

  data : User[] = [];
  loggedInUser: any;
  user_profile: UserProfile | null = null;
  warning : string = '';
  private tokenRefreshSubScription?: Subscription;

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
  
  constructor() { }
  ngOnDestroy(): void {
  //   if (this.tokenRefreshSubScription)
  //     this.tokenRefreshSubScription.unsubscribe();
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

  // getSpecificUser(id: number)
  // {
  //   this.userService.getSpecificUser(id).subscribe({
  //     next: (data) => {
  //       console.log("Data for specific user is...", data);
  //       this.loggedInUser = data;
  //     },
  //     error: err => {
  //       console.log("Error...", err);
  //     }
  //   })
  // }

  removeUser(user_id: number)
  {
    
    if (confirm('Are you sure you want to remove this user?'))
    this.userService.removeUser(user_id).subscribe({
      next: data => {
        this.getUser();
      },
      error: err => {
        console.log("Error...", err);
      }
    })
  }

  updateUser(id: number)
  {
    console.log("Update user with id...", id);
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


}
