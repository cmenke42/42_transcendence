import { Component, HostListener, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbCollapseModule, NgbDropdown, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/user.service';
import { UserProfile } from '../../interface/user-profile';
import { ProfileUpdateService } from '../../service/ProfileUpdateService';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChangeDetectorRef } from '@angular/core';
import { User } from '../../interface/user';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterOutlet,
    NgbCollapseModule,
    NgbDropdownModule,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  //changeDetection: ChangeDetectionStrategy.OnPush
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
  currentLang = this.user_profile?.preferred_language;
  user_info:User | null = null;
  // user_info: any;


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

  ngOnInit(): void 
  {
    this.user_info = this.userService.getLoggedInUser();
    this.changeTheme('dark');
    this.getProfile();
    this.relationProfile();
    this.notification_interval = setInterval(() => {
      this.relationProfile();
    }, 50000);
    this.profileUpdateService.currentProfile.subscribe(profile => {
      if (profile) {
        this.user_profile = profile;
        this.updateLanguage(profile.preferred_language);
      }
    });
  }


  constructor(
    private profileUpdateService: ProfileUpdateService,
    private translate: TranslateService,

    
  ) {}

  

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
            // console.log('data......', data);
            this.userData = data;
            console.log('User Data...', this.userData);
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
        this.router.navigate(['/home/Users'])
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
        this.router.navigate(['/home/Users'])
        console.log("Friend Request Rejected", data);
      },
      error: (err) =>
      {
        console.log("Error...", err);
      }
    })
  }

  useLanguage(language: string): void {

    
    const formData = new FormData();
    formData.append('preferred_language', language);
    if (this.user_profile) {
      this.userService.updateProfile(this.user_profile.user_id, formData).subscribe({
      next: (updatedProfile) => {
        this.user_profile = updatedProfile;
        this.profileUpdateService.updateProfile(updatedProfile);
        this.currentLang = language;
        this.translate.use(language);
        console.log('Language updated successfully');
        this.getProfile();
      },
      error: (err) => {
        console.error('Error updating Language', err);
      }
    });
  }

}     

  getCurrentLanguageCode(): string {

    //console.log('Get Current Language:', this.user_profile?.preferred_language);
    this.updateLanguage(this.user_profile?.preferred_language);
    if (this.user_profile?.preferred_language=== 'de')
      return 'Deutsch';
    else if (this.user_profile?.preferred_language === 'ru')
      return 'Русский';
    else if (this.user_profile?.preferred_language === 'pk')
      return 'اردو';
    else 
      return 'English';
  }

  updateLanguage(language: string | undefined): void {
    if (language) {
      //console.log('updateLanguage:', this.user_profile?.preferred_language);
      this.currentLang = language;
      this.translate.use(language);
      localStorage.setItem('preferredLanguage', language);
    }
  }
}
