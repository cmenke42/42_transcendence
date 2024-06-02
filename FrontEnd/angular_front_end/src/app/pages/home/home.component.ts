import { Component, OnDestroy, OnInit, inject} from '@angular/core';
import { UserService } from '../../service/user.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserData } from '../../interface/user-data';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor() { }
  ngOnDestroy(): void {
    if (this.tokenRefreshSubScription)
      this.tokenRefreshSubScription.unsubscribe();
  }

  data : UserData[] = [];
  loggedInUser: UserData | null = null;
  Userdata: any;
  // userId: number  = 2;

  userService = inject(UserService);
  router = inject(Router)

  private tokenRefreshSubScription?: Subscription;
 
  ngOnInit() 
  {
    this.loggedInUser = this.userService.getLoggedInUser();
    if (this.loggedInUser?.is_superuser)
      this.getUser();
    if (this.loggedInUser?.user_id)
      this.getSpecificUser(this.loggedInUser.user_id);
    this.tokenRefreshSubScription = 
    this.userService.tokenRefreshed.subscribe(() =>{
      this.refreshData();
    })
  }
 

  refreshData()
  {
    if (this.loggedInUser?.is_superuser)
      this.getUser();
    if (this.loggedInUser?.user_id)
      this.getSpecificUser(this.loggedInUser.user_id);
  }
  // data: UserData[] = [];
 

  getUser()
  {
    this.userService.getUserData().subscribe({
      next: (data: UserData[]) => {
        this.data = data;  
        console.log("Data is...", data);
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
        this.Userdata = data;
        console.log("Data for specific user is...", data);
      },
      error: err => {
        console.log("Error...", err);
      }
    })
  }

  removeUser(id: number)
  {
    this.userService.removeUser(id).subscribe({
      next: data => {
        console.log("User removed...", data);
        this.getUser();
      },
      error: err => {
        console.log("Error...", err);
      }
    })
  }

  logout() 
  {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
