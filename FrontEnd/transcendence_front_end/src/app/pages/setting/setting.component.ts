import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/user.service';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { SocketsService } from '../../service/sockets.service';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NgbCollapseModule,
    TranslateModule,
    RouterLink
  ],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css'
})
export class SettingComponent implements OnInit, OnDestroy {

  isCollapsed = true;
  isCollapseMap: { [userId : string] : boolean} = {} // map creation
  user_list: any;
  user_id : number = 0;
  sender : string = '';
  private list_timer: any;

  userService = inject(UserService);
  socketService = inject(SocketsService);
  router = inject(Router);



  constructor(
    private translate: TranslateService,
  ) {
    const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
    this.translate.use(preferredLanguage); 
  }




  ngOnInit(): void {
  this.showUserProfile();
  this.userService.getterProfile().subscribe(nickname => {
    this.sender = nickname.nickname;
  });
  this.list_timer = setInterval(() => {
    this.showUserProfile();
  }, 3000);
  }

  ngOnDestroy(): void {
    clearInterval(this.list_timer);
  }


  showUserProfile()
  {
    //userListRelationships
    this.userService.userListRelationships().subscribe({
      next: (data: any[]) => {
        console.log("list of the users", data);
        this.user_list = data;
        
        // Log friendship status for each user
        data.forEach(user => {
          console.log(`User ${user.user_id} friendship status:`, user.friendship_status);
        });
      },
      error: (err) => {
        console.log("Error...", err);
      }
    });
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

  blockUser(blocked_id : number)
  {
    this.userService.BlockUser(blocked_id).subscribe({
      next: (data: any) =>
      {
        this.ngOnInit();
        console.log("User blocked Successfull", data);
      },
      error: (err) =>
      {
        console.log("Error...", err);
      }
    })
  }

  friendRequest(id: number)
  {
    this.userService.addFriend(id).subscribe({
      next: (data: any) =>
      {
        this.ngOnInit();
        console.log("Friend Request Sent", data);
      },
      error: (err) =>
      {
        console.log("Error...", err);
      }
    })
  }

  acceptRequest(id: number)
  {
    this.userService.acceptFriend(id).subscribe({
      next: (data: any) =>
      {
        this.ngOnInit();
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
        console.log("Friend Request Rejected", data);
      },
      error: (err) =>
      {
        console.log("Error...", err);
      }
    })
  }

  unBlockUser(blocked_id: number)
  {
    this.userService.unBlockUser(blocked_id).subscribe({
      next: (data: any) =>
      {
        this.ngOnInit();
        console.log("User unblocked Successfull", data);
      },
      error: (err) =>
      {
        console.log("Error...", err);
      }
    })
  }

  removeFriend(id: number)
  {
    this.userService.removeFriend(id).subscribe({
      next: (data: any) =>
      {
        this.ngOnInit();
        console.log("Friend Removed", data);
      },
      error: (err) =>
      {
        console.log("Error...", err);
      }
    })
  }

}
