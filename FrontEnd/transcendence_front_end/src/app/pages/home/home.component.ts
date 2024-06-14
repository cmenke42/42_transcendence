import { Component, OnDestroy, OnInit, inject} from '@angular/core';
import { UserService } from '../../service/user.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '../../interface/user';
import { UserProfile } from '../../interface/user-profile';
import { NgbDropdown, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NgbDropdownModule,
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
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
    if (this.loggedInUser?.user_id)
    {
      this.getProfile();
      this.getSpecificUser(this.loggedInUser.user_id); // do we need this?
    }

    // this.tokenRefreshSubScription = 
    // this.JWT.tokenRefrshed.subscribe(() =>{
    //   this.refreshData();
    // })
  }
  
  constructor() { }
  ngOnDestroy(): void {
  //   if (this.tokenRefreshSubScription)
  //     this.tokenRefreshSubScription.unsubscribe();
  }
  


  // Userdata: User | null = null;
  // userId: number  = 2;

  // toastService = inject(ToastService)


 
 

  // refreshData()
  // {
  //   if (this.loggedInUser?.is_superuser)
  //     this.getUser();
  //   if (this.loggedInUser?.user_id)
  //   {
  //     this.getSpecificUser(this.loggedInUser.user_id);
  //     this.getProfile();
  //   }
  // }

  getUser()
  {
    this.userService.getUserData().subscribe({
      next: (data: User[]) => {
        this.data = data;  
        // console.log("Data is...", data);
      },
      error: err => {
        console.log("Error...", err);
      }
    })
  }

  getSpecificUser(id: number)
  {
    this.userService.getSpecificUser(id).subscribe({
      next: (data) => {
        console.log("Data for specific user is...", data);
        this.loggedInUser = data;
      },
      error: err => {
        console.log("Error...", err);
      }
    })
  }

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
    if (this.loggedInUser?.user_id)
    {
      this.userService.showProfile(this.loggedInUser?.user_id).subscribe({
        next: (data) => {
          console.log("Data for profile is...", data);
          this.user_profile = data;
          if (this.user_profile?.nickname === ('nickname-' + this.user_profile?.user))
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

  logout() 
  {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  changeTheme(theme:string)
  {
    const body=document.body as HTMLElement
    body.setAttribute('data-bs-theme',theme)
  }
}
