import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { UserService } from '../../service/user.service';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { jwtDecode } from 'jwt-decode';
import { SocketsService } from '../../service/sockets.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NgbCollapseModule
  ],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css'
})
export class SettingComponent implements OnInit {

  isCollapsed = true;
  isCollapseMap: { [userId : string] : boolean} = {} // map creation
  user_list: any;
  user_id : number = 0;
  sender : string = '';

  userService = inject(UserService);
  socketService = inject(SocketsService);
  router = inject(Router);

  ngOnInit(): void {
  this.showUserProfile();
  //  console.log('setting test jwt : ', this.userService.getterProfile().subscribe());
  // //  user_id = localStorage.getItem('access_token');
  this.userService.getterProfile().subscribe(nickname => {
    this.sender = nickname.nickname;
    // console.log("Nickname:", nickname.nickname);
  });
  }


  showUserProfile()
  {
    this.userService.showListProfiles().subscribe(
    {
      next: (data: any) =>
      {
        console.log("list of the user", data);
        this.user_list = data;
      },
      error: (err) => 
      {
        console.log("Error...", err);
      }
    }
    )
  }

  toggleCollapse(userId: string)
  {
    this.isCollapseMap[userId] = !this.isCollapseMap[userId];
  }

  inbox(receiver: string)
  {
    this.socketService.privateConnect(this.sender, receiver);
    this.router.navigate(['/private_chat'], {state: {sender : this.sender, receiver}});
  }

}
