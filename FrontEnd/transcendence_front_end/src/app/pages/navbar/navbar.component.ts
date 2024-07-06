import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbCollapseModule, NgbDropdown, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/user.service';
import { UserProfile } from '../../interface/user-profile';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterOutlet,
    NgbCollapseModule,
    NgbDropdownModule,
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {

  auth = inject(AuthService);
  router = inject(Router);
  userService = inject(UserService);
  isMenuCollapsed = true;
  isScrolled = false;
  user_profile: UserProfile | null = null;
  user_relationship: any[] = [];
  private notification_interval: any;
  jwt: any;
  userData: any;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }
  
  FA(action: boolean, id: number)
  {
    if (confirm("Are you sure you want to change FA?")) 
    {
      this.userService.changeFA(action, id).subscribe({
        next: (data: any) =>
        {
          this.ngOnInit();
          console.log("FA", data);
        },
        error: (err: any) =>
        {
          console.log("Error...", err);
        }
      })
    }
  }

  ngOnInit(): void {
    this.changeTheme('dark');
    this.getProfile();
    this.relationProfile();
    this.notification_interval = setInterval(() => {
      this.relationProfile();
    }, 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.notification_interval);
  }

  relationProfile()
  {
    this.userService.userListRelationships().subscribe({
      next: (data: []) => {
        // console.log("user relationship data", data)
        // this.user_relationship = data;
        this.user_relationship = data.filter((user: any) => user.friendship_status === 'received_request')
      },
      error: (err) => {
        console.log("Error...", err);
      }
    })
  }

  //getSpecificUser
  getProfile()
  {
    this.userService.getterProfile().subscribe({
      next: (data: UserProfile) => {
        this.user_profile = data;
        this.userService.getSpecificUser(this.user_profile.user_id).subscribe({
          next: (data: any) =>
          {
            console.log('data......', data);
            this.userData = data;
          },
          error: (err: any) => 
          {
            console.log('Error...', err);
          }
        })
      },
      error: (err) => {
        console.log("Error...", err);
      }
    })
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

  acceptRequest(id: number)
  {
    this.userService.acceptFriend(id).subscribe({
      next: (data: any) =>
      {
        this.ngOnInit();
        this.router.navigate(['/home/setting'])
        console.log("Friend Request Accepted", data);
      },
      error: (err) =>
      {
        console.log("Error...", err);
      }
    })
  }

  rejectRequest(id: number)
  {
    this.userService.declineFriend(id).subscribe({
      next: (data: any) =>
      {
        this.ngOnInit();
        this.router.navigate(['/home/setting'])
        console.log("Friend Request Rejected", data);
      },
      error: (err) =>
      {
        console.log("Error...", err);
      }
    })
  }

}
